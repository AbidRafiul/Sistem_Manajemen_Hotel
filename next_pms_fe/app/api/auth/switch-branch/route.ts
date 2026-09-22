/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file route.ts
 * @description BFF route untuk switch active branch pengguna
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/tools/authTools";
import { formatDateISO, formatDateSystem } from "@/lib/tools/dateTools";
import axios from "axios";

export const POST = async (req: NextRequest) => {
    try {
        const session = await auth();

        if (!session || !session.access_token) {
            return NextResponse.json(
                {
                    status: "99",
                    message: "Sesi Anda telah berakhir. Silakan login kembali.",
                    datetime: formatDateSystem(new Date()),
                },
                { status: 401 }
            );
        }

        const body = await req.json();

        const headers = {
            "Content-Type": "application/json",
            "X-Timestamp": formatDateISO(new Date()) as string,
            "Authorization": `Bearer ${session.access_token}`,
        };

        const result = await axios.post(
            `${process.env.API_URL}/auth/switch-branch`,
            body,
            { headers }
        );

        return NextResponse.json(result.data, { status: result.status });
    } catch (error: any) {
        console.error("BFF Switch Branch Error:", error?.response?.data || error.message);

        const status = error?.response?.status || 500;
        const responseData = error?.response?.data || {
            status: "99",
            message: error.message || "Gagal beralih cabang",
            datetime: formatDateSystem(new Date()),
        };

        return NextResponse.json(responseData, { status });
    }
};
