# Audio

`attack-on-token.mp3` is the background track for `/events/attack-on-token`.
It is the only audio the site loads, it is served from this origin, and there
is no player embed anywhere.

## What is in here, and where it came from

The master supplied for this is:

    ../../../New inspo/Relaxing With Japanese Bamboo Flute , Guzheng, Erhu  Musical Instrument Collection.mp3

That file is **3 hours 18 minutes and 169 MB**. It is a listening compilation,
not a loop, and it cannot be deployed: it would blow past static-asset limits
and no visitor is going to download 169 MB to hear thirty seconds of flute
behind a hero image.

`attack-on-token.mp3` is therefore the **first three minutes of that file**,
cut on MP3 frame boundaries with no re-encode, so it is bit-identical to the
master over that window. The Xing header was rewritten to the new frame and
byte counts, so players report 3:00 rather than 3:18:00. Result: 2.5 MB.

The master stays in `New inspo/` with the other source material. Do not move it
into this folder or anywhere else under `public/`.

## Changing the excerpt

There is no ffmpeg on the machine this was built on, which is why the cut is a
frame copy rather than a proper encode. If you have ffmpeg, you can do better
than a hard cut at three minutes:

```bash
ffmpeg -ss 0 -t 180 -i "../../../New inspo/<master>.mp3" -c:a libmp3lame -b:a 96k -ac 2 attack-on-token.mp3
```

Pick a window that starts and ends somewhere musically sensible. The page
ramps the volume down over the last two seconds and back up over the first two
(see `LOOP_FADE` in `src/components/site/music-box.tsx`), so a seam in the
middle of a phrase is survivable, but it is not an excuse for a bad cut.

## If the file is missing

The music widget hides itself rather than rendering a button that does nothing,
so the site deploys fine without this file. Path, starting volume, fade length
and auto-start all live in `src/lib/audio.ts`.

## Licensing

**This needs checking before launch.** An event page is a public performance,
and a compilation of this kind is very unlikely to carry a licence that covers
putting it on a public website. Either confirm the committee holds the rights,
or replace it with production music licensed for web use, or with something a
student in the department wrote. The code does not care which file is here.
