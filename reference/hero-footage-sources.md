# Hero drone footage — sources

Five clips generated on Higgsfield (Kling 3.0 Pro, image-to-video, 10s, no audio) on 2026-09-07,
each from a still already in `backend/uploads/seed/`. Roughly 17.5 credits per clip.

The 1080p masters are **not** committed — they total ~157 MB. Re-fetch them from the URLs below
rather than regenerating, which would cost credits again. They are also listed under the account's
Higgsfield generation history if these URLs ever expire.

| Page | Base name | Source still | Master |
| --- | --- | --- | --- |
| Home | `68-bristol-drone` | sale-68-bristol.webp | https://d8j0ntlcm91z4.cloudfront.net/user_3GgBL9pjsplUTV4U1azMqdhxRo7/hf_20260907_163904_0f35ebea-8353-477a-9e2e-960f38f95689.mp4 |
| Listings | `listings-oceanfront` | hero-aerial.jpg | https://d8j0ntlcm91z4.cloudfront.net/user_3GgBL9pjsplUTV4U1azMqdhxRo7/hf_20260907_163918_5e5d7a4e-0069-4177-8f5b-e9fcbbb1383a.mp4 |
| Rentals | `rentals-shoreline` | sale-2220-ocean-shore.webp | https://d8j0ntlcm91z4.cloudfront.net/user_3GgBL9pjsplUTV4U1azMqdhxRo7/hf_20260907_163904_4b33b788-9bcf-4a71-ac09-d5b1067a01cf.mp4 |
| Management | `management-towers` | home-away.jpg | https://d8j0ntlcm91z4.cloudfront.net/user_3GgBL9pjsplUTV4U1azMqdhxRo7/hf_20260907_163918_358f5e97-61ec-4293-a3b9-fe34f678b37a.mp4 |
| HomeAway | `home-away-sunset` | home-away-hero.jpg | https://d8j0ntlcm91z4.cloudfront.net/user_3GgBL9pjsplUTV4U1azMqdhxRo7/hf_20260907_163904_c964691d-bce0-4025-b564-ef1ab6732f3e.mp4 |

## Encode

Web versions live in `backend/uploads/seed/video/`. `HeroVideo.jsx` appends the extensions itself,
so page code references the base path only.

```bash
# desktop — capped at the master's own width, never upscaled
ffmpeg -i MASTER.mp4 -vf "scale='min(1920,iw)':-2" -c:v libx264 -preset slow -crf 28 \
  -x264-params aq-mode=3 -pix_fmt yuv420p -an -movflags +faststart NAME.mp4
# mobile
ffmpeg -i MASTER.mp4 -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -crf 30 \
  -x264-params aq-mode=3 -pix_fmt yuv420p -an -movflags +faststart NAME-mobile.mp4
# poster — frame 0 matches the source still, so the poster/video swap is seamless
ffmpeg -i MASTER.mp4 -frames:v 1 -q:v 4 NAME-poster.jpg
```

No WebM. VP9 was tested at CRF 36/40/44 and came out no smaller than x264 at matched quality, so it
only added bytes and a 404 per page load.

`management-towers` needs a colour grade prepended to the filter chain — it came out of Kling washed
out, with a yellow-green cast and grey water, while the other four were vivid:

```
eq=contrast=1.28:saturation=1.45:brightness=-0.045:gamma=0.97,colorbalance=rs=-0.04:gs=-0.02:bs=0.07:rm=-0.03:bm=0.05
```
