import Map "mo:core/Map";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

actor {
  type Book = {
    id : Nat;
    title : Text;
    author : Text;
    price : Float;
    sales : Nat;
    royaltyPerSale : Float;
  };

  let books = Map.empty<Nat, Book>();
  var currentId = 0;

  func calculateRoyalties(sales : Nat, royaltyPerSale : Float) : Float {
    sales.toFloat() * royaltyPerSale;
  };

  public shared ({ caller }) func addBook(title : Text, author : Text, price : Float, sales : Nat, royaltyPerSale : Float) : async Nat {
    let book : Book = {
      id = currentId;
      title;
      author;
      price;
      sales;
      royaltyPerSale;
    };
    books.add(currentId, book);
    currentId += 1;
    book.id;
  };

  public shared ({ caller }) func updateBook(id : Nat, title : Text, author : Text, price : Float, sales : Nat, royaltyPerSale : Float) : async Bool {
    switch (books.get(id)) {
      case (null) { Runtime.trap("Book with id " # id.toText() # " does not exist. ") };
      case (?_) {
        let updatedBook : Book = {
          id;
          title;
          author;
          price;
          sales;
          royaltyPerSale;
        };
        books.add(id, updatedBook);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteBook(id : Nat) : async Bool {
    if (not books.containsKey(id)) { Runtime.trap("Book " # id.toText() # " does not exist. ") };
    books.remove(id);
    true;
  };

  public query ({ caller }) func getBooks() : async [Book] {
    books.values().toArray();
  };

  public query ({ caller }) func getStats() : async {
    totalBooks : Nat;
    totalSales : Nat;
    totalRoyalties : Float;
  } {
    let allBooks = books.values().toArray();
    let totalSales = allBooks.foldLeft(0, func(accum, book) { accum + book.sales });
    let totalRoyalties = allBooks.foldLeft(0.0, func(accum, book) { accum + calculateRoyalties(book.sales, book.royaltyPerSale) });

    {
      totalBooks = allBooks.size();
      totalSales;
      totalRoyalties;
    };
  };
};
