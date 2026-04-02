# Pantrio

<p align="center">
	<img src="public/img/logo.png" alt="Pantrio logo" width="140" />
</p>

Pantrio is a recipe and meal-planning web app that helps users turn pantry ingredients into meal ideas, track favorites, explore cuisines, and plan weekly or calorie-based meals.

## App Preview

### Main Pages

| Home | Generate |
| --- | --- |
| ![Home](public/img/page1.png) | ![Generate](public/img/generate.png) |

| Cuisines | Planner |
| --- | --- |
| ![Cuisines](public/img/cuisines.png) | ![Planner](public/img/planner.png) |

| Calories | Daily Calories |
| --- | --- |
| ![Calories](public/img/calories.png) | ![Daily Calories](public/img/daily-calories.png) |

## Overview

The project is focused on practical meal planning:

- generate recipe ideas from ingredients already on hand
- filter by dietary needs, cuisine, cooking time, and calorie target
- save favorites locally in the browser
- build a weekly meal plan
- create a daily calorie-based meal plan

Everything runs on the frontend with local browser storage for saved data.

## Features

- Pantry-based recipe generation
- Cuisine and dietary filters
- Target calorie recipe generation
- Favorites with local save/import/export
- Recent recipe history
- Weekly meal planner
- Daily calorie planner
- Meal calorie summary page
- Interactive recipe card with copy/share/print/cook mode

## Pages

- `/` — Home
- `/generate` — Recipe generator
- `/cuisines` — Cuisine explorer
- `/planner` — Weekly meal planner
- `/calories` — Meal calories overview
- `/daily-calories` — Daily calorie meal planner

## Tech Stack

- Next.js
- React
- Tailwind CSS
- Local browser storage (`localStorage`)

## Data Storage

Pantrio stores data locally in the browser, including:

- favorites
- recent recipes
- pinned favorites
- weekly meal plan
- daily calorie plan

No account or database setup is required.

## Project Structure

- [pages](pages) — app routes
- [components](components) — reusable UI pieces
- [lib](lib) — recipe and calorie utilities
- [public/img](public/img) — static image assets
- [styles](styles) — global styles

## Running Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run start
```

3. Open:

http://localhost:3000

## Useful Scripts

- `npm run start` — start local development server
- `npm run run` — same as development run
- `npm run build` — build the project
- `npm run preview` — build and preview exported static output
- `npm run clean` — remove build output

## Notes

- The app is currently set up as a static-friendly Next.js project.
- Images are served from [public/img](public/img).
- Build artifacts such as [out](out) and [.next](.next) can be regenerated at any time.

## Future Improvements

- add tests
- improve nutrition accuracy
- support persistent backend storage
- add better mobile interactions
