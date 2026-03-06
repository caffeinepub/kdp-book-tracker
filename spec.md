# KDP Book Tracker

## Current State
New project. No existing backend or frontend code beyond scaffolding.

## Requested Changes (Diff)

### Add
- Motoko backend canister with persistent storage for book records
- CRUD operations: add book, update book, delete book, list all books
- Each book record: id, title, author, price, sales, royaltyPerSale
- Dashboard summary endpoint: total books, total sales, total royalty
- Frontend dashboard with 3 summary cards: Total Books, Total Sales, Total Royalty
- Add/Update Book form with fields: Book Title, Author Name, Price, Sales, Royalty per Sale
- Save Book button that creates or updates depending on edit mode
- Book list with search/filter by title
- Each book row: Title, Author, Price, Sales, Royalty per Sale, Total Royalty (sales × royaltyPerSale)
- Edit button per row (populates form with book data)
- Delete button per row (removes book from backend)
- Export CSV button that downloads all books as a CSV file

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Define Motoko backend actor with stable storage for books (HashMap or Array), CRUD functions: addBook, updateBook, deleteBook, getBooks, and a getStats query returning totals.
2. Generate backend bindings (backend.d.ts).
3. Build React frontend:
   - App shell with header
   - Dashboard section: 3 stat cards (Total Books, Total Sales, Total Royalty $)
   - Add/Update Book form: inputs for title, author, price, sales, royaltyPerSale; Save button; Cancel button when editing
   - Book list section: search input, table/card list of books with Edit/Delete per row
   - Export CSV logic: build CSV string from book data and trigger browser download
4. Wire all form actions to backend actor calls.
5. Apply blue (#1a73e8) and white color scheme with card-style components and rounded inputs/buttons.
