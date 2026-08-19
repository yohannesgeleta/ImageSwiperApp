# ImageSwiperApp

ImageSwiperApp is a React Native and Expo Router project. The mobile app displays random dog images and lets users swipe left or right in a Tinder-style interaction. The project is extended into a portfolio-ready app by hardening API loading, improving responsive layout, and adding a GitHub Pages web deployment path.

## Purpose

The goal of this project is to demonstrate practical mobile and web app development skills:

- Building a cross-platform Expo app with TypeScript
- Using gesture-driven UI with React Native Gesture Handler and Reanimated
- Fetching and validating third-party API data
- Managing shared state across routed screens
- Preparing a static web build for deployment
- Documenting setup, build, and QA steps for other developers

## Features

- Swipeable dog image cards with animated left/right gestures
- Like and Dislike buttons for non-gesture interaction
- Profile screen for saving a user name, age, and preferred dog breed
- Breed list from the Dog CEO API
- Breed descriptions from Dog API when available
- Retry states for failed image or breed requests
- Responsive layout for phones, tablets, and web
- Static export configuration for GitHub Pages

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- Expo Router
- React Native Gesture Handler
- React Native Reanimated
- TypeScript
- GitHub Pages deployment through `gh-pages`

## Development Notes

This project started from the Expo starter template, then the starter screens were replaced with a two-tab app:

- `Home` displays the active breed and a swipeable dog image card.
- `Profile` loads breed data, saves user details, and updates the breed used by the swiper.

The shared breed preference is managed with React context instead of a mutable exported variable. API calls are isolated in `services/dog-api.ts`, where HTTP status and response shape are checked before the UI uses the returned data. This keeps network errors from becoming silent rendering bugs.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

Run the web version locally:

```bash
npm run web
```

## Build

Create a production web build in `dist/`:

```bash
npm run build:web
```

The app is configured for GitHub Pages project hosting at:

```text
https://<github-username>.github.io/ImageSwiperApp/
```

If the GitHub repository is renamed, update `expo.experiments.baseUrl` in `app.json` to match the new repository name.

## Deploy To GitHub Pages

Push the source code to a GitHub repository named `ImageSwiperApp`, then run:

```bash
npm run deploy
```

This command runs the web export and publishes `dist/` to the `gh-pages` branch. The deploy script includes `--nojekyll` because Expo emits bundled files inside `_expo/`, and GitHub Pages must serve that folder as-is.

In the GitHub repository settings, configure Pages to deploy from the `gh-pages` branch.

## Quality Checks

Run these checks before publishing changes:

```bash
npm run lint
npx tsc --noEmit
npm run build:web
```

Manual QA checklist:

- Home loads a dog image on first visit.
- Like and Dislike load another image.
- Swiping left and right loads another image.
- Profile loads the breed picker.
- Changing the selected breed updates the Home screen.
- Retry buttons appear when network requests fail.
- The exported web build uses `/ImageSwiperApp/` asset and route paths.

## APIs

- Dog CEO API: random images and breed list
- Dog API: breed description data

