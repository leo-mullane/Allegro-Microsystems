# Allegro MicroSystems: product discovery requirements

Derived from the ClerksWell brief and the review of allegromicro.com, TI, Flowtech, Halfords, Infineon and Analog Devices. IDs are referenced in HTML comments in `src/`.

## Global
- R01 Search box in the header on every page, accepting part numbers, orderable part numbers, competitor parts, product types and keywords.
- R02 Grouped typeahead; exact part or orderable part number goes straight to the part page.
- R03 Four doors (Search, Products, Applications, Product Finder) with equal billing in navigation and on the homepage.
- R04 Region selector (currency, distributors, ship-to) separate from language selector.
- R05 Samples and quote basket available from every page.

## Part page
- R06 One canonical, menu-independent URL per base part; breadcrumb follows the product taxonomy.
- R07 Key specs, lifecycle status and design-profile fit in the first screen.
- R08 Overview, design and evaluation, quality and safety.
- R09 Orderable part numbers with stock, lead time, MOQ, price.
- R10 Sample, quote and (later) buy per orderable part number.
- R11 Distributor stock by region.
- R12 Documents tagged to the part, listed once; HTML datasheet summary.
- R13 Similar parts with compare.
- R14 Recently viewed, saved comparisons and open quotes.
- R15 News and campaigns demoted below discovery on the homepage.

## Products
- R16 Whole product range on one page, max four levels, live counts, skip-to-listing.
- R17 Parametric filters with live counts, disabled dead ends, URL state.
- R18 Application as a filter on product tables (no duplicate catalogues).
- R19 Results table with availability, compare (max four), CSV export.
- R20 Product type selection guidance, de-duplicated resources.

## Applications
- R21 Applications taxonomy: Market, System, Subsystem; a system may sit under several markets.
- R22 Problem-first system pages with architecture variants as tabs.
- R23 Clickable block diagram: block → why it matters → suggested parts → pre-filtered product table.

## Product Finder
- R24 Start from a competitor part number or an existing Allegro part.
- R25 Stepped questions in engineering terms, live counts, no dead ends.
- R26 Saved design profile marks fitting parts across the site.

## Commerce foundation
- R27 One basket for samples, quote and future purchase, at orderable-part level.
- R28 Quote request with validation; retrievable by reference.
