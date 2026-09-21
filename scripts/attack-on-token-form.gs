/**
 * Builds the Attack on Token registration form in Google Forms.
 *
 * WHY THIS EXISTS
 * ---------------
 * The event takes entries on a form and the fee by UPI, because a payment
 * gateway charged 2% of every team's fee to do a job a QR code does for
 * nothing. Google Forms is free, has no monthly cap on responses, and can
 * actually refuse a non-VIT address, which is the one thing the form this
 * replaces could not be made to do.
 *
 * HOW TO RUN IT
 * -------------
 * 1. Go to https://script.google.com and click New project.
 * 2. Delete whatever is in the editor and paste this whole file in.
 * 3. Save, then pick `buildAttackOnTokenForm` in the function dropdown at the
 *    top and press Run.
 * 4. Google asks for permission the first time. It will say the app is not
 *    verified, because it is your own script and nobody verifies those. Click
 *    Advanced, then "Go to (project name) (unsafe)", then Allow. It is asking
 *    for three things: make a form, make a spreadsheet, and fetch the QR image
 *    off cesac.in.
 * 5. When it finishes, open the Execution log at the bottom. It prints four
 *    links. The one you want is SHARE THIS LINK.
 *
 * Running it twice makes a second form. If you want to start over, delete the
 * old form out of your Drive first so you cannot hand out the wrong link.
 *
 * WHAT IT CANNOT DO
 * -----------------
 * - Colours, fonts and the header banner. Apps Script has no access to the
 *   theme at all, so those are a few clicks by hand, listed at the bottom of
 *   this file.
 * - The optional payment screenshot. Apps Script cannot create a file upload
 *   question, and a form that has one forces every student to sign in to a
 *   Google account before they can answer anything. The transaction reference
 *   below is the record that matters, so this leaves the upload out. Add it by
 *   hand later if you want it, knowing it costs you the sign-in.
 */

const CONFIG = {
  formTitle: 'Attack on Token · Team registration',
  emailDomain: 'vit.edu',
  amountInr: 125,
  perHead: '62.50',
  upiId: 'viralnotviral@oksbi',
  upiPayee: 'Viral Not Viral',
  qrImageUrl: 'https://www.cesac.in/aot/upi-qr.jpg',
  qrWidthPx: 320,
  teamCap: 80,
  dates: '3 and 4 October 2026',
  firstDay: '3 October',
  /** A Google Sheet of the responses. Set false if you would rather not have one. */
  createResponsesSheet: true,
  responsesSheetName: 'Attack on Token registrations',
};

/** The rupee sign, in one place so every amount on the form reads the same. */
const RS = '₹';

function buildAttackOnTokenForm() {
  const form = FormApp.create(CONFIG.formTitle);

  form.setDescription(
    'Three chapters. One battlefield. ' + CONFIG.dates + ' at VIT Pune. The venue ' +
    'is announced closer to the day.\n\n' +
    'Teams are exactly two people and both of you need a VIT address. Entry is ' +
    RS + CONFIG.amountInr + ' for the team, which is ' + RS + CONFIG.perHead + ' each, paid by UPI on the ' +
    'second page. One of you fills this in once, for both of you.\n\n' +
    'It takes about two minutes. Have your partner\'s VIT email and a UPI app to hand.'
  );

  // ----------------------------------------------------------------- page 1

  form.addSectionHeaderItem()
    .setTitle('Who is registering')
    .setHelpText('Whoever fills this in is the person we contact. Your partner does not fill in a second copy.');

  form.addTextItem()
    .setTitle('Your full name')
    .setHelpText('As you would want it read out in a hall.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Your VIT email')
    .setHelpText('Has to end in @' + CONFIG.emailDomain + '. This is how we check you study here.')
    .setRequired(true)
    .setValidation(vitEmailRule());

  form.addTextItem()
    .setTitle('Your WhatsApp number')
    .setHelpText('Ten digits, no +91 and no spaces. Everything about the event goes out on WhatsApp, so give us the number you actually read.')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('Ten digits starting with 6, 7, 8 or 9. No +91, no spaces, no dashes.')
        .requireTextMatchesPattern('^[6-9][0-9]{9}$')
        .build()
    );

  form.addTextItem()
    .setTitle('Team name')
    .setHelpText('Anything you like, as long as somebody can read it out on stage.')
    .setRequired(true);

  form.addSectionHeaderItem()
    .setTitle('Your partner')
    .setHelpText('Teams are exactly two. There is no solo entry and no team of three.');

  form.addTextItem()
    .setTitle('Partner\'s full name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Partner\'s VIT email')
    .setHelpText('Also has to end in @' + CONFIG.emailDomain + '. Read it back before you move on, because it is the only address we have for them.')
    .setRequired(true)
    .setValidation(vitEmailRule());

  // ----------------------------------------------------------------- page 2

  form.addPageBreakItem()
    .setTitle('Pay the entry fee')
    .setHelpText(
      RS + CONFIG.amountInr + ' for the team, which is ' + RS + CONFIG.perHead + ' each. Scan the code with any ' +
      'UPI app, pay, then come back to this page and put the reference in. ' +
      'Nothing is held for you until that reference is in.'
    );

  const qr = form.addImageItem()
    .setTitle('Scan to pay ' + RS + CONFIG.amountInr)
    .setHelpText(
      'Paying ' + CONFIG.upiPayee + ', UPI ID ' + CONFIG.upiId + '. Check that name comes ' +
      'up in your app before you confirm. If your phone will not scan off a screen, ' +
      'type the UPI ID in by hand instead.'
    )
    .setAlignment(FormApp.Alignment.CENTER);

  try {
    qr.setImage(UrlFetchApp.fetch(CONFIG.qrImageUrl).getBlob().setName('upi-qr.jpg'))
      .setWidth(CONFIG.qrWidthPx);
  } catch (err) {
    Logger.log('COULD NOT FETCH THE QR IMAGE: ' + err);
    Logger.log('The form is built, but that question has no picture in it. Open the form,');
    Logger.log('click the image question, and upload public/aot/upi-qr.jpg by hand.');
  }

  form.addSectionHeaderItem()
    .setTitle('After you have paid')
    .setHelpText('Your UPI app shows a reference on the receipt screen. That number is the only thing tying your payment to your team, so copy it before you close the app.');

  form.addTextItem()
    .setTitle('UPI transaction reference')
    .setHelpText('Called the UTR, the transaction ID or the reference number, depending on the app. Usually twelve digits.')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('Copy the reference off your UPI receipt. Letters and numbers only, at least six of them.')
        .requireTextMatchesPattern('^[A-Za-z0-9]{6,}$')
        .build()
    );

  form.addTextItem()
    .setTitle('Name on the account you paid from')
    .setHelpText('Only fill this in if it is not your own name, for example if a parent paid. It saves us guessing when we match payments to teams.')
    .setRequired(false);

  // ----------------------------------------------------------------- page 3

  form.addPageBreakItem()
    .setTitle('Last thing');

  form.addParagraphTextItem()
    .setTitle('Anything we should know')
    .setHelpText('Access needs, a clash with another event, a question about the chapters. Leave it empty if there is nothing.')
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('Tick both before you send this')
    .setChoiceValues([
      'Both of us are VIT students and both addresses above are spelled right',
      'We have paid ' + RS + CONFIG.amountInr + ' and the reference above came from that payment',
    ])
    .setRequired(true)
    .setValidation(
      FormApp.createCheckboxValidation()
        .setHelpText('Both of these have to be true before we can take the entry.')
        .requireSelectExactly(2)
        .build()
    );

  // --------------------------------------------------------------- settings

  form.setConfirmationMessage(
    'Registered. Your team is on the list.\n\n' +
    'Every payment is checked against the account by hand, so give us a day or two ' +
    'before you worry. If the reference does not match anything we message the ' +
    'WhatsApp number you gave us. Do not pay a second time.\n\n' +
    'All ' + CONFIG.teamCap + ' teams start at Chapter I. See you on ' + CONFIG.firstDay + '.'
  );

  form.setCollectEmail(false);      // no Google sign-in; the typed VIT addresses are the check
  form.setAllowResponseEdits(true); // so a team can fix a mistyped reference
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(true);
  form.setShuffleQuestions(false);
  form.setAcceptingResponses(true);

  // A form built by script is not open to the world by default. Google made
  // publishing a separate step, and a form that has not had it done returns
  // "You must sign in to access this content" to everybody who opens the link.
  // Accepting responses is not the same switch and does not cover it.
  try {
    form.setPublished(true);
  } catch (err) {
    Logger.log('Could not publish from here: ' + err);
    Logger.log('Do it by hand: Publish, then Manage, then General access.');
  }

  let sheetUrl = 'not created';
  if (CONFIG.createResponsesSheet) {
    const ss = SpreadsheetApp.create(CONFIG.responsesSheetName);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    sheetUrl = ss.getUrl();
  }

  const publishedUrl = form.getPublishedUrl();
  let shareUrl = publishedUrl;
  try {
    shareUrl = form.shortenFormUrl(publishedUrl);
  } catch (err) {
    Logger.log('Short link unavailable, the long one works just as well: ' + err);
  }

  Logger.log('');
  Logger.log('SHARE THIS LINK   ' + shareUrl);
  Logger.log('Long version      ' + publishedUrl);
  Logger.log('Edit the form     ' + form.getEditUrl());
  Logger.log('Responses sheet   ' + sheetUrl);
  Logger.log('');
  Logger.log('Paste SHARE THIS LINK into REGISTER.formUrl in src/lib/data/event.ts, then deploy.');

  return { share: shareUrl, published: publishedUrl, edit: form.getEditUrl(), sheet: sheetUrl };
}

/**
 * The rule the old form could never enforce: an address off the VIT domain is
 * refused on the spot rather than collected and argued about a week later.
 *
 * Google Forms matches with RE2 and is case sensitive, so the domain is spelled
 * out as either-case letters rather than trusting a (?i) flag to be honoured.
 * `vit.edu` becomes `[Vv][Ii][Tt]\.[Ee][Dd][Uu]`.
 */
function vitEmailRule() {
  const domain = CONFIG.emailDomain
    .split('')
    .map(function (ch) {
      if (ch === '.') return '\\.';
      if (/[a-z]/i.test(ch)) return '[' + ch.toUpperCase() + ch.toLowerCase() + ']';
      return ch;
    })
    .join('');

  return FormApp.createTextValidation()
    .setHelpText('Use the VIT address, the one ending in @' + CONFIG.emailDomain + '. Personal addresses are not accepted.')
    .requireTextMatchesPattern('^[A-Za-z0-9._%+-]+@' + domain + '$')
    .build();
}

/**
 * THE CLICKS THE SCRIPT CANNOT DO
 * -------------------------------
 * FIRST, LET PEOPLE IN. Publishing and letting anyone open the link are two
 * different settings, and the script can only do the first. Until the second
 * is set, everybody who opens the form is told to sign in, and most will just
 * give up. Click Publish at the top right, then Manage, then under General
 * access choose anyone with the link, then Done and Publish.
 *
 * Check it the honest way: open the link in a private window, signed out. If
 * you see the form, students will too. If you see a sign-in box, they will too.
 *
 * Nothing else here forces a sign-in. This form collects no verified email, has
 * no file upload question and does not limit responses to one per person, which
 * are the three settings that would drag the sign-in wall back in on their own.
 *
 * THEN THE COLOURS. Click the paint palette at the top right, and set:
 *
 *   Colour       the + beside the swatches, then  B8202C   (the event crimson)
 *   Background   the lightest tint offered, or the + and  F2EAD9  (parchment)
 *   Text style   Header: Playfair Display if it is offered, otherwise leave it
 *   Header       upload a banner if you have one, around 1600 x 400
 *
 * Those are the event's own colours, the same ones the website runs on. Google
 * Forms gives you one accent colour, one background tint, a font and a banner,
 * and that is the whole of what it lets you change. Do not go looking for more.
 */
