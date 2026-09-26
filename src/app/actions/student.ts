"use server";

import { revalidatePath } from "next/cache";

import { requireRecordOwner } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

export type StudentDataState = {
  error?: string;
  notice?: string;
  field?: "name" | "prn" | "student_class" | "phone";
};

/**
 * A mobile number as somebody would write it on a form.
 *
 * Spaces, dashes, brackets and a country code all turn up, and all of them
 * mean the same ten digits. Stored bare, because a number that is sometimes
 * "+91 98765 43210" and sometimes "9876543210" is two numbers as far as any
 * search is concerned.
 */
function readPhone(raw: string): { value: string | null; error?: string } {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return { value: null };

  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  if (local.length !== 10 || !/^[6-9]/.test(local)) {
    return { value: null, error: "Indian mobile numbers are ten digits and start with 6 to 9." };
  }
  return { value: local };
}

/**
 * The student's own record of themselves.
 *
 * Name, class, PRN and mobile. The address is not here and never will be: that
 * one belongs to the account, it is what the whole roster was imported on, and
 * the database reverts a hand-written change to it.
 *
 * The PRN is the one field two students can collide on, and the collision is
 * caught by a unique index rather than by asking first. Asking first leaves a
 * gap between the question and the write, and this is the field most likely to
 * be typed in wrong by the person sitting next to you.
 */
export async function saveStudentData(
  _state: StudentDataState,
  formData: FormData,
): Promise<StudentDataState> {
  // A student, or an organiser or the owner editing their own details from
  // /admin/profile. Only ever the caller's own row: the update below is
  // pinned to viewer.id, whatever an organiser's People capability allows.
  const viewer = await requireRecordOwner();

  const name = String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
  if (name.length < 2) {
    return { error: "Put in your name as it should read on a certificate.", field: "name" };
  }

  const prn = String(formData.get("prn") ?? "")
    .trim()
    .toUpperCase();
  if (prn && !/^[A-Z0-9/-]{6,20}$/.test(prn)) {
    return { error: "A PRN is 6 to 20 characters, letters and digits only.", field: "prn" };
  }

  const studentClass = String(formData.get("student_class") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .slice(0, 24);
  if (studentClass && !/^[A-Z0-9 .-]{1,24}$/.test(studentClass)) {
    return {
      error: "Write your class the way the timetable does, SY-F.",
      field: "student_class",
    };
  }

  const phone = readPhone(String(formData.get("phone") ?? ""));
  if (phone.error) return { error: phone.error, field: "phone" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      prn: prn || null,
      student_class: studentClass || null,
      phone: phone.value,
    })
    .eq("id", viewer.id);

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Another account already holds that PRN. Check yours, and tell an organiser if it is right.",
        field: "prn",
      };
    }
    console.error("student data save failed", error);
    return { error: "That did not save. Try again in a minute." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/profile");
  return { notice: "Saved." };
}
