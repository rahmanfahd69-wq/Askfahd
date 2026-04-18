"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FoodItem {
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function saveFoodLog(data: {
  date: string;
  food_description: string;
  items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("food_logs").insert({
    client_id: user.id,
    date: data.date,
    food_description: data.food_description,
    items: data.items,
    total_calories: data.total_calories,
    total_protein: data.total_protein,
    total_carbs: data.total_carbs,
    total_fat: data.total_fat,
  });

  if (error) return { error: error.message };
  revalidatePath("/client/tracker");
  return { success: true };
}

export async function deleteFoodLog(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("food_logs")
    .delete()
    .eq("id", id)
    .eq("client_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/client/tracker");
  return { success: true };
}

export async function getFoodLogsByDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { logs: [] };

  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("client_id", user.id)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) return { logs: [] };
  return { logs: data || [] };
}
