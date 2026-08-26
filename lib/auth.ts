import { createPocketBaseClient } from "@/lib/pocketbase";
import type { RecordModel } from "pocketbase";

export interface AuthUser {
	id: string;
	email: string | null;
	name: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
	try {
		const pb = await createPocketBaseClient();
		if (!pb.authStore.isValid) return null;
		try {
			await pb.collection("users").authRefresh();
		} catch {
			pb.authStore.clear();
			return null;
		}
		if (!pb.authStore.isValid) {
			pb.authStore.clear();
			return null;
		}
		const record = pb.authStore.record as RecordModel | null;
		if (!record || typeof record.id !== "string") {
			pb.authStore.clear();
			return null;
		}
		return {
			id: record.id,
			email:
				typeof (record as { email?: unknown }).email === "string"
					? ((record as { email?: unknown }).email as string)
					: null,
			name:
				typeof (record as { name?: unknown }).name === "string"
					? ((record as { name?: unknown }).name as string)
					: "",
		};
	} catch {
		return null;
	}
}
