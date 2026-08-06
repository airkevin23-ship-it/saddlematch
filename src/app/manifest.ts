import type { MetadataRoute } from "next";

// Web app manifest. This is the file that turns SaddleMatch from a page
// in a browser into something that installs.
//
// With display "standalone", tapping Share > Add to Home Screen gives the
// user an icon on their home screen that launches full screen: no address
// bar, no tabs, no browser buttons. No amount of CSS achieves that, and it
// is the single largest difference between "website" and "app".
//
// start_url is "/" rather than a screen inside the app, because an
// installed launcher should not deep-link a logged-out person straight
// into an auth-gated route.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SaddleMatch — Dating for the Western Lifestyle",
    short_name: "SaddleMatch",
    description:
      "Meet Austin singles who love two-stepping, live country music, rodeos, and real Texas connections.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8f3",
    theme_color: "#fff8f3",
    categories: ["social", "lifestyle"],
    icons: [
      {
        src: "/saddlematch-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
      {
        // Maskable tells Android it may crop this to whatever shape the
        // launcher uses, instead of dropping the square into a white circle.
        src: "/saddlematch-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
