import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.from("tenants").select("*").order("TenantID", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const insert = {
    Firstname: body.Firstname ?? null,
    Lastname: body.Lastname ?? null,
    Email: body.Email ?? "",
    Phone: body.Phone ?? null,
  };

  const { data, error } = await supabase.from("tenants").insert([insert]).select().single();
  if (error) {
    console.error("Tenant insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// DELETE support to enable client-side rollback by TenantID
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("id");
  if (!tenantId) return NextResponse.json({ error: "Missing id query param" }, { status: 400 });

  const { data, error } = await supabase.from("tenants").delete().eq("TenantID", Number(tenantId)).select().single();
  if (error) {
    console.error("Tenant delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get("id");

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID is required for update" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Construct a payload with only the fields that are allowed to be updated.
  const updatePayload: { [key: string]: any } = {
    Firstname: body.Firstname,
    Lastname: body.Lastname,
    Email: body.Email,
    Phone: body.Phone,
  };

  // Remove any keys with undefined values so they don't nullify existing data.
  Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

  const { data, error } = await supabase
    .from("tenants")
    .update(updatePayload)
    .eq("TenantID", Number(tenantId))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}