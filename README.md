# Real-Time Clock Dashboard

A polished React-based world-clock dashboard that combines an analog clock, a digital clock, timezone management, alarms, and dynamic UI controls in a single responsive interface.

## Features

- Live analog and digital time updates every second
- Multi-region timezone cards with add/remove controls
- Primary focus clock with a selectable timezone
- Alarm scheduling with enable, snooze, and dismiss actions
- Audible alarm alerts using the browser audio API
- Dynamic UI controls for seconds display, light/dark mode, compact layout, and accent color
- Persistent timezone preferences saved in browser storage

## Tech Stack

- React 19
- Vite 8
- CSS for responsive dashboard styling
- Vitest for regression testing

## Project Structure

- src/App.jsx: main dashboard component, timezone logic, clock rendering, and alarm behavior
- src/App.css: visual design, clock layout, and responsive styling
- src/App.test.jsx: regression tests for the time formatting helper

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the local URL shown by Vite in the browser.

## Available Scripts

- npm run dev — start the local development server
- npm run build — build the app for production
- npm run test — run the regression test suite

## Screenshots

<img width="1647" height="830" alt="image" src="https://github.com/user-attachments/assets/c18fbb2e-26be-44a0-939a-6b0592188710" />

## Notes

The app uses browser localStorage to preserve the selected primary timezone and the list of visible timezone cards between refreshes.
