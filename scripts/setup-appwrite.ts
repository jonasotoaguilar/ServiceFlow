import { Client, Databases, Permission, Role } from "node-appwrite";
import "dotenv/config";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
	console.error("Missing Appwrite environment variables");
	process.exit(1);
}

const client = new Client()
	.setEndpoint(endpoint)
	.setProject(projectId)
	.setKey(apiKey);

const databases = new Databases(client);

const DB_ID = "Service-system-db";
const COLLECTIONS = {
	Services: "Services",
	LOCATIONS: "locations",
	LOCATION_LOGS: "location-logs",
};

async function main() {
	try {
		// 1. Create Database if not exists
		try {
			await databases.get(DB_ID);
			console.log(`Database ${DB_ID} already exists.`);
		} catch (e) {
			console.log(`Creating database ${DB_ID}...`);
			await databases.create(DB_ID, "Service System DB");
		}

		// 2. Create Locations Collection
		await createCollection(
			COLLECTIONS.LOCATIONS,
			"Locations",
			[
				{ key: "name", type: "string", size: 255, required: true },
				{ key: "userId", type: "string", size: 255, required: true },
				{ key: "isActive", type: "boolean", required: false, default: true },
				{ key: "createdAt", type: "datetime", required: false },
				{ key: "updatedAt", type: "datetime", required: false },
			],
			[
				{ key: "userId", type: "key" },
				{ key: "name", type: "key" },
			],
		);

		// 3. Create Services Collection
		await createCollection(
			COLLECTIONS.Services,
			"Services",
			[
				{ key: "userId", type: "string", size: 255, required: true },
				{ key: "invoiceNumber", type: "string", size: 255, required: false },
				{ key: "clientName", type: "string", size: 255, required: true },
				{ key: "rut", type: "string", size: 50, required: false },
				{ key: "contact", type: "string", size: 255, required: false },
				{ key: "email", type: "string", size: 255, required: false },
				{ key: "product", type: "string", size: 255, required: true },
				{
					key: "failureDescription",
					type: "string",
					size: 5000,
					required: false,
				},
				{ key: "sku", type: "string", size: 255, required: false },
				{ key: "locationId", type: "string", size: 255, required: true },
				{ key: "entryDate", type: "datetime", required: true },
				{ key: "deliveryDate", type: "datetime", required: false },
				{ key: "readyDate", type: "datetime", required: false },
				{ key: "cancellationDate", type: "datetime", required: false },
				{
					key: "status",
					type: "string",
					size: 50,
					required: false,
					default: "pending",
				},
				{ key: "repairCost", type: "integer", required: false, default: 0 },
				{ key: "notes", type: "string", size: 5000, required: false },
			],
			[
				{ key: "userId", type: "key" },
				{ key: "status", type: "key" },
				{ key: "locationId", type: "key" },
				{ key: "clientName", type: "fulltext" },
				{ key: "invoiceNumber", type: "key" },
				{ key: "rut", type: "key" },
			],
		);

		// 4. Create Location Logs Collection
		await createCollection(
			COLLECTIONS.LOCATION_LOGS,
			"Location Logs",
			[
				{ key: "userId", type: "string", size: 255, required: true },
				{ key: "ServiceId", type: "string", size: 255, required: true },
				{ key: "fromLocationId", type: "string", size: 255, required: true },
				{ key: "toLocationId", type: "string", size: 255, required: true },
				{ key: "changedAt", type: "datetime", required: true },
			],
			[
				{ key: "userId", type: "key" },
				{ key: "ServiceId", type: "key" },
				{ key: "fromLocationId", type: "key" },
				{ key: "toLocationId", type: "key" },
			]
		);

		console.log("Appwrite setup completed successfully!");
	} catch (error) {
		console.error("Error setting up Appwrite:", error);
	}
}

async function createCollection(
	id: string,
	name: string,
	attributes: any[],
	indexes?: any[],
) {
	let collectionExists = false;
	try {
		await databases.getCollection(DB_ID, id);
		console.log(`Collection ${name} already exists.`);
		collectionExists = true;
	} catch (e) {
		console.log(`Creating collection ${name}...`);
		await databases.createCollection(DB_ID, id, name, [
			Permission.read(Role.any()),
			Permission.write(Role.any()),
			Permission.update(Role.any()),
			Permission.delete(Role.any()),
		]);
	}

	// Always attempt to create Attributes
	for (const attr of attributes) {
		console.log(`Creating attribute ${attr.key} for ${name}...`);
		try {
			if (attr.type === "string") {
				await databases.createStringAttribute(
					DB_ID,
					id,
					attr.key,
					attr.size || 255,
					attr.required,
					attr.default,
				);
			} else if (attr.type === "boolean") {
				await databases.createBooleanAttribute(
					DB_ID,
					id,
					attr.key,
					attr.required,
					attr.default,
				);
			} else if (attr.type === "integer") {
				await databases.createIntegerAttribute(
					DB_ID,
					id,
					attr.key,
					attr.required,
					0,
					999999999,
					attr.default,
				);
			} else if (attr.type === "datetime") {
				await databases.createDatetimeAttribute(
					DB_ID,
					id,
					attr.key,
					attr.required,
					attr.default,
				);
			}
			// Wait a bit to ensure sequential creation
			await new Promise((r) => setTimeout(r, 500));
		} catch (err: any) {
			if (err.code === 409)
				console.log(`Attribute ${attr.key} already exists.`);
			else console.error(`Failed to create attribute ${attr.key}:`, err);
		}
	}

	// Always attempt to create Indexes
	if (indexes) {
		console.log("Waiting for attributes to be ready...");
		await new Promise((r) => setTimeout(r, 5000));

		for (const idx of indexes) {
			console.log(`Creating index ${idx.key} for ${name}...`);
			try {
				await databases.createIndex(
					DB_ID,
					id,
					idx.key,
					idx.type,
					[idx.key],
					[idx.type === "fulltext" ? "DESC" : "ASC"],
				);
			} catch (err: any) {
				if (err.code === 409) console.log(`Index ${idx.key} already exists.`);
				else console.error(`Failed to create index ${idx.key}:`, err);
			}
		}
	}
}

main();
