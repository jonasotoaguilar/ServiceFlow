import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getServiceStats } from "@/lib/storage";
// tenant-global stats shape: pending, ready, completed, cancelled, upcoming, critical

export async function GET() {
	const user = await getAuthUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	try {
		const stats = await getServiceStats(user.id);
		return NextResponse.json(stats);
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
