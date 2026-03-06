import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Book {
    id: bigint;
    title: string;
    author: string;
    sales: bigint;
    price: number;
    royaltyPerSale: number;
}
export interface backendInterface {
    addBook(title: string, author: string, price: number, sales: bigint, royaltyPerSale: number): Promise<bigint>;
    deleteBook(id: bigint): Promise<boolean>;
    getBooks(): Promise<Array<Book>>;
    getStats(): Promise<{
        totalSales: bigint;
        totalRoyalties: number;
        totalBooks: bigint;
    }>;
    updateBook(id: bigint, title: string, author: string, price: number, sales: bigint, royaltyPerSale: number): Promise<boolean>;
}
