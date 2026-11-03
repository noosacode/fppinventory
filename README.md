# Frangipani Inventory

A separate web app for current plant stocktake quantities, variety/group maintenance, prices, temporary discounts, and manual WooCommerce reconciliation. It is structured as separate HTML pages and JavaScript files to keep each feature easy to find.

## Included

- Current inventory grid seeded with 51 varieties from the supplied `fppstocktake` sheet. The imported quantities are the current values in that sheet; blank cells were treated as zero.
- Editable shortcodes, variety names, and groups. Group 7 is treated as inactive. Existing group assignments were read from the workbook's `groups` sheet.
- Pot options based on the stocktake headings and a price grid with the workbook's starting group base prices and pot factors.
- Discounts set per variety and pot size. A discount remains active until it is removed.
- A manual WooCommerce reconciliation page. It displays app quantities and expected prices for active, in-stock items and lets you check them off after comparing/updating WooCommerce.
- A dated history snapshot of quantities, group assignments, prices, discounts, and items checked whenever a reconciliation is marked complete.
- One administrator login created during first-time setup.

## Requirements

- Node.js 20 or later
- A MongoDB Atlas connection string
- A Vercel account for deployment (the deployment pattern matches `frangipanis02`)

## Run it on your computer

1. Extract this folder somewhere convenient.
2. Install Node.js if it is not already installed.
3. In the extracted folder, copy `.env.example` to `.env`.
4. In `.env`, replace the MongoDB example with your Atlas connection string. Keep `JWT_SECRET` private and replace it with a long random value. The app selects a separate database named `frangipani_inventory`, so it does not use the existing app's database name.
5. Open a terminal in this folder and run `npm install`.
6. Run `npm run seed` once to load the included variety list and stock counts. The importer will not overwrite a database that already contains varieties.
7. Run `npm start`, then open `http://localhost:3000`.
8. Choose **Set up the first administrator** and create a username and password of at least 10 characters.

## Deploy to Vercel

1. Create a new GitHub repository for this extracted folder. Do not upload your `.env` file.
2. Import that repository into Vercel and deploy it as a separate project.
3. In Vercel project settings, add `MONGODB_URI` and `JWT_SECRET` as environment variables for the production deployment.
4. Deploy. Open the app and create the first administrator account.
5. To import the starter inventory into the hosted database, run `npm run seed` locally with the same `MONGODB_URI` in `.env`. The `seed` script does not overwrite existing variety data.

MongoDB network access must allow connections from the deployment. Configure Atlas network access for your Vercel deployment according to your MongoDB account and hosting setup.

## Prices and pot options

Pot sizes and stem types are configured in `backend/config.js`. The starting inventory options cover the stocktake through 25L; the price grid also includes the larger sizes present in the workbook. The starting base prices and multipliers come from `pricegrid`. Confirm the mappings and amounts in the Pricing page before using them for a live store check.

The UI displays Australian dollars (AUD). Change the `currency` option in `public/js/app.js` if your WooCommerce store uses another currency.

## Security notes

- `.env` is ignored by Git. Never share your MongoDB URI or JWT secret.
- The first-account setup endpoint stops accepting registrations once an account exists.
- The database connection uses the explicit `frangipani_inventory` database name, separate from the existing plant app.

## Notes on reconciliation

Reconciliation is manual: the app does not log in to WooCommerce or modify the online store. The completion action saves a snapshot of the app data and the products you confirmed. Group 7 varieties are excluded from the active product checklist, while their current quantities are still included in saved stock snapshots.
