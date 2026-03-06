import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  BookOpen,
  DollarSign,
  Download,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type Book,
  useAddBook,
  useDeleteBook,
  useGetBooks,
  useGetStats,
  useUpdateBook,
} from "./hooks/useQueries";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatNumber(n: bigint | number): string {
  return new Intl.NumberFormat("en-US").format(
    typeof n === "bigint" ? Number(n) : n,
  );
}

function exportCSV(books: Book[]) {
  const headers = [
    "Title",
    "Author",
    "Price",
    "Sales",
    "Royalty Per Sale",
    "Total Royalty",
  ];
  const rows = books.map((b) => [
    `"${b.title.replace(/"/g, '""')}"`,
    `"${b.author.replace(/"/g, '""')}"`,
    b.price.toFixed(2),
    b.sales.toString(),
    b.royaltyPerSale.toFixed(2),
    (Number(b.sales) * b.royaltyPerSale).toFixed(2),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "books.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Empty form state ──────────────────────────────────────────────────────────

interface FormState {
  title: string;
  author: string;
  price: string;
  sales: string;
  royaltyPerSale: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  author: "",
  price: "",
  sales: "",
  royaltyPerSale: "",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  "data-ocid": ocid,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  isLoading: boolean;
  "data-ocid": string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      data-ocid={ocid}
    >
      <Card className="shadow-stat border-border/60 card-hover cursor-default select-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {label}
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-24 rounded-md" />
              ) : (
                <p className="text-3xl font-display font-bold stat-number leading-none">
                  {value}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Book Form ─────────────────────────────────────────────────────────────────

interface BookFormProps {
  editBook: Book | null;
  onCancel: () => void;
  onSuccess: () => void;
}

function BookForm({ editBook, onCancel, onSuccess }: BookFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    editBook
      ? {
          title: editBook.title,
          author: editBook.author,
          price: editBook.price.toFixed(2),
          sales: editBook.sales.toString(),
          royaltyPerSale: editBook.royaltyPerSale.toFixed(2),
        }
      : EMPTY_FORM,
  );

  // Sync form when editBook changes
  const prevEditId = useRef<bigint | null>(null);
  if (editBook && editBook.id !== prevEditId.current) {
    prevEditId.current = editBook.id;
    setForm({
      title: editBook.title,
      author: editBook.author,
      price: editBook.price.toFixed(2),
      sales: editBook.sales.toString(),
      royaltyPerSale: editBook.royaltyPerSale.toFixed(2),
    });
  } else if (!editBook && prevEditId.current !== null) {
    prevEditId.current = null;
    setForm(EMPTY_FORM);
  }

  const addBook = useAddBook();
  const updateBook = useUpdateBook();
  const isPending = addBook.isPending || updateBook.isPending;

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const title = form.title.trim();
    const author = form.author.trim();
    const price = Number.parseFloat(form.price);
    const sales = Number.parseInt(form.sales, 10);
    const royaltyPerSale = Number.parseFloat(form.royaltyPerSale);

    if (!title || !author) {
      toast.error("Title and Author are required.");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (Number.isNaN(sales) || sales < 0) {
      toast.error("Please enter valid sales count.");
      return;
    }
    if (Number.isNaN(royaltyPerSale) || royaltyPerSale < 0) {
      toast.error("Please enter a valid royalty per sale.");
      return;
    }

    try {
      if (editBook) {
        await updateBook.mutateAsync({
          id: editBook.id,
          title,
          author,
          price,
          sales: BigInt(sales),
          royaltyPerSale,
        });
        toast.success("Book updated successfully.");
      } else {
        await addBook.mutateAsync({
          title,
          author,
          price,
          sales: BigInt(sales),
          royaltyPerSale,
        });
        toast.success("Book added successfully.");
        setForm(EMPTY_FORM);
      }
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Card
      className="shadow-card border-border/60"
      data-ocid="book_form.section"
    >
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            {editBook ? (
              <Pencil className="w-4 h-4 text-primary" />
            ) : (
              <PlusCircle className="w-4 h-4 text-primary" />
            )}
          </span>
          {editBook ? "Edit Book" : "Add Book"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="book-title" className="text-sm font-medium">
                Book Title
              </Label>
              <Input
                id="book-title"
                placeholder="e.g. The Midnight Library"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="rounded-lg border-input focus-visible:ring-primary/30 focus-visible:border-primary"
                data-ocid="book_form.title.input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-author" className="text-sm font-medium">
                Author Name
              </Label>
              <Input
                id="book-author"
                placeholder="e.g. Matt Haig"
                value={form.author}
                onChange={(e) => handleChange("author", e.target.value)}
                className="rounded-lg border-input focus-visible:ring-primary/30 focus-visible:border-primary"
                data-ocid="book_form.author.input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-price" className="text-sm font-medium">
                Price ($)
              </Label>
              <Input
                id="book-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="9.99"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className="rounded-lg border-input focus-visible:ring-primary/30 focus-visible:border-primary"
                data-ocid="book_form.price.input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-sales" className="text-sm font-medium">
                Sales
              </Label>
              <Input
                id="book-sales"
                type="number"
                min="0"
                step="1"
                placeholder="1200"
                value={form.sales}
                onChange={(e) => handleChange("sales", e.target.value)}
                className="rounded-lg border-input focus-visible:ring-primary/30 focus-visible:border-primary"
                data-ocid="book_form.sales.input"
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="book-royalty" className="text-sm font-medium">
                Royalty per Sale ($)
              </Label>
              <Input
                id="book-royalty"
                type="number"
                min="0"
                step="0.01"
                placeholder="2.49"
                value={form.royaltyPerSale}
                onChange={(e) => handleChange("royaltyPerSale", e.target.value)}
                className="rounded-lg border-input focus-visible:ring-primary/30 focus-visible:border-primary md:max-w-xs"
                data-ocid="book_form.royalty.input"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium px-6"
              data-ocid="book_form.save.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Book"
              )}
            </Button>
            <AnimatePresence>
              {editBook && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-lg border-border text-muted-foreground hover:text-foreground"
                    data-ocid="book_form.cancel.button"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Cancel
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Book Row ──────────────────────────────────────────────────────────────────

interface BookRowProps {
  book: Book;
  index: number;
  onEdit: (book: Book) => void;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}

function BookRow({ book, index, onEdit, onDelete, isDeleting }: BookRowProps) {
  const totalRoyalty = Number(book.sales) * book.royaltyPerSale;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.98 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.2) }}
      data-ocid={`book_list.item.${index}`}
      className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-xs card-hover"
    >
      {/* Book info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <p className="font-display font-semibold text-foreground text-base leading-tight truncate">
            {book.title}
          </p>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {book.author}
          </p>
        </div>
        <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Price
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatUSD(book.price)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Sales
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatNumber(book.sales)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Royalty/Sale
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatUSD(book.royaltyPerSale)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Total Royalty
            </p>
            <p className="text-sm font-bold stat-number">
              {formatUSD(totalRoyalty)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(book)}
          className="rounded-lg border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 text-muted-foreground transition-colors"
          data-ocid={`book_list.edit_button.${index}`}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(book.id)}
          disabled={isDeleting}
          className="rounded-lg border-border hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 text-muted-foreground transition-colors"
          data-ocid={`book_list.delete_button.${index}`}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          Delete
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: books, isLoading: booksLoading } = useGetBooks();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const deleteBook = useDeleteBook();

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    const q = search.toLowerCase().trim();
    if (!q) return books;
    return books.filter((b) => b.title.toLowerCase().includes(q));
  }, [books, search]);

  function handleEdit(book: Book) {
    setEditBook(book);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleCancelEdit() {
    setEditBook(null);
  }

  function handleFormSuccess() {
    setEditBook(null);
  }

  async function handleDelete(id: bigint) {
    setDeletingId(id);
    try {
      await deleteBook.mutateAsync(id);
      toast.success("Book deleted.");
      if (editBook?.id === id) setEditBook(null);
    } catch {
      toast.error("Could not delete book.");
    } finally {
      setDeletingId(null);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster position="top-right" richColors />

      {/* ── Header ── */}
      <header className="header-pattern sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-xl leading-tight tracking-tight">
              KDP Book Tracker
            </h1>
            <p className="text-white/70 text-xs font-body">
              Manage your Kindle Direct Publishing catalog
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* ── Dashboard ── */}
        <section
          aria-labelledby="dashboard-heading"
          data-ocid="dashboard.section"
        >
          <h2 id="dashboard-heading" className="sr-only">
            Dashboard Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={BookOpen}
              label="Total Books"
              value={stats ? formatNumber(stats.totalBooks) : "0"}
              isLoading={statsLoading}
              data-ocid="dashboard.total_books.card"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Sales"
              value={stats ? formatNumber(stats.totalSales) : "0"}
              isLoading={statsLoading}
              data-ocid="dashboard.total_sales.card"
            />
            <StatCard
              icon={DollarSign}
              label="Total Royalty"
              value={stats ? formatUSD(stats.totalRoyalties) : "$0.00"}
              isLoading={statsLoading}
              data-ocid="dashboard.total_royalty.card"
            />
          </div>
        </section>

        {/* ── Add / Edit Form ── */}
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <BookForm
            editBook={editBook}
            onCancel={handleCancelEdit}
            onSuccess={handleFormSuccess}
          />
        </motion.div>

        {/* ── Book List ── */}
        <motion.section
          aria-labelledby="book-list-heading"
          data-ocid="book_list.section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle
                  id="book-list-heading"
                  className="font-display text-xl"
                >
                  Books
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => books && books.length > 0 && exportCSV(books)}
                  disabled={!books || books.length === 0}
                  className="rounded-lg border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 font-medium self-start sm:self-auto"
                  data-ocid="book_list.export.button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search books by title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-lg border-input focus-visible:ring-primary/30 focus-visible:border-primary"
                  data-ocid="book_list.search.search_input"
                />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {booksLoading ? (
                <div
                  data-ocid="book_list.loading_state"
                  className="space-y-3"
                  aria-label="Loading books"
                  aria-busy="true"
                >
                  {["sk1", "sk2", "sk3"].map((sk) => (
                    <Skeleton key={sk} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredBooks.length === 0 ? (
                <motion.div
                  data-ocid="book_list.empty_state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-primary/60" />
                  </div>
                  <p className="text-base font-display font-semibold text-foreground">
                    {search
                      ? "No books match your search."
                      : "No books added yet."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search
                      ? "Try a different title."
                      : "Add your first book using the form above."}
                  </p>
                </motion.div>
              ) : (
                <motion.div layout className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredBooks.map((book, idx) => (
                      <BookRow
                        key={book.id.toString()}
                        book={book}
                        index={idx + 1}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isDeleting={deletingId === book.id}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border/60 py-5 px-4">
        <p className="text-center text-sm text-muted-foreground">
          © {currentYear}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
