import { redirect } from "next/navigation";
import { createPocketBaseClient } from "@/lib/pocketbase";

type VerifySearchParams = {
	token?: string | string[];
	status?: string | string[];
};

export default async function VerifyPage({
	searchParams,
}: {
	searchParams: Promise<VerifySearchParams>;
}) {
	const params = await searchParams;
	const raw = params.token;
	const token = Array.isArray(raw) ? raw[0] : raw;
	if (!token) {
		const status = Array.isArray(params.status) ? params.status[0] : params.status;
		if (status === "ok" || status === "fail") {
			return null;
		}
		redirect("/verify?status=fail");
	}
	try {
		const pb = await createPocketBaseClient();
		await pb.collection("users").confirmVerification(token);
	} catch {
		redirect("/verify?status=fail");
	}
	redirect("/verify?status=ok");
}
