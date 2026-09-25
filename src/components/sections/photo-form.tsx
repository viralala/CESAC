"use client";

import { useActionState, useEffect, useId, useState } from "react";

import { savePhoto, type PhotoState } from "@/app/actions/photo";
import { Notice } from "@/components/console/shell";
import { PHOTO_EDGE } from "@/lib/photos";

/**
 * Crop to the middle square and shrink to PHOTO_EDGE, as a JPEG.
 *
 * Done here rather than on the server for three reasons: a phone photo is
 * several megabytes and the upload rides in on a server action with a body
 * limit; the square is what every board draws, so there is no point storing
 * the rest; and re-encoding through a canvas drops the EXIF block, which on a
 * phone photo can carry the GPS position it was taken at.
 */
async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const edge = Math.min(PHOTO_EDGE, side);

  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, edge, edge);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.86),
  );
}

export function PhotoForm({
  current,
  next,
  forced,
}: {
  /** The photo already on the account, to show until a new one is chosen. */
  current: string | null;
  next: string;
  forced: boolean;
}) {
  const uid = useId();
  const [picked, setPicked] = useState<{ blob: Blob; url: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const [state, action, pending] = useActionState<PhotoState, FormData>(async (prev, form) => {
    if (!picked) return { error: "Choose a photo first." };
    form.set("photo", new File([picked.blob], "photo.jpg", { type: "image/jpeg" }));
    return savePhoto(prev, form);
  }, {});

  // The preview is an object URL, which holds the image in memory until it is
  // let go. Released when a new one replaces it and when the form goes away.
  useEffect(() => () => {
    if (picked) URL.revokeObjectURL(picked.url);
  }, [picked]);

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setProblem(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProblem("That is not a photo. Pick a JPEG, PNG or WebP image.");
      return;
    }
    try {
      const blob = await squareJpeg(file);
      setPicked({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setProblem(
        "This browser could not open that photo. Try a different one, or take a screenshot of it and use that.",
      );
    }
  }

  const shown = picked?.url ?? current;

  return (
    <form action={action} className="mt-7 grid gap-6">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-wrap items-center gap-6">
        <span className="relative grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-ink/20 bg-cream-2">
          {shown ? (
            // A local object URL or the photo already saved; next/image has
            // nothing to optimise in the first case and the second is small.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="label-sm px-4 text-center text-muted">No photo yet</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <label htmlFor={`${uid}-photo`} className="label block text-ink">
            {current || picked ? "Choose a different photo" : "Choose a photo"}
          </label>
          <input
            id={`${uid}-photo`}
            type="file"
            accept="image/*"
            onChange={choose}
            className="mt-2.5 block w-full text-[0.9rem] text-ink file:mr-4 file:cursor-pointer file:rounded-full file:border-2 file:border-ink file:bg-transparent file:px-4 file:py-2 file:font-bold file:text-ink hover:file:bg-ink hover:file:text-cream"
          />
          <p className="serif-it mt-2 text-[0.85rem] leading-relaxed text-muted">
            Your face, clearly, on its own. It is cropped to the middle square, so keep yourself
            centred.
          </p>
        </div>
      </div>

      {problem ? <Notice tone="error">{problem}</Notice> : null}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <button
        type="submit"
        disabled={pending || !picked}
        className="pill pill-lime w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving" : forced ? "Save it and continue" : "Save the photo"}
      </button>
    </form>
  );
}
