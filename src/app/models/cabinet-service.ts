export interface CabinetService {
    serviceId?: string;     // Optional for new services if ID is backend-generated, or if not always present
    serviceName: string;   // Matches backend's serviceName
    price: number; 
}
