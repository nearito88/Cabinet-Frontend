export interface Appointmentproduct {
    appointmentProductId?: string; // optional if not always returned
    appointmentId: string | undefined;
    productId: string;
    productName: string;
    quantity: number;
}
