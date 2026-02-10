export type ServiceStatus = "pending" | "ready" | "completed" | "cancelled";

export interface Service {
	id: string;
	clientName: string;
	invoiceNumber?: string; // Obligatorio en UI
	product: string;
	failureDescription?: string; // Nuevo campo Falla
	sku?: string;
	rut?: string;
	contact?: string; // Obligatorio en UI
	email?: string;
	locationId: string;
	location?: string; // Nombre de la Sede (vía join)
	entryDate: string; // ISO Date string
	deliveryDate?: string; // ISO Date string (Fecha de entrega/completada)
	readyDate?: string; // ISO Date string (Fecha en que estuvo lista)
	cancellationDate?: string; // ISO Date string (Fecha de cancelación)
	status: ServiceStatus;
	repairCost?: number;
	notes?: string;
	userId: string;
	locationLogs?: LocationLog[];
}

export interface LocationLog {
	id: string;
	ServiceId: string;
	fromLocationId: string;
	toLocationId: string;
	changedAt: string; // ISO Date
	fromLocation?: string; // Nombre opcional
	toLocation?: string; // Nombre opcional
}

export type NewServicePayload = Omit<Service, "id" | "status"> & {
	status?: ServiceStatus;
};
