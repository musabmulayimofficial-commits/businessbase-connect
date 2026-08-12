import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type ConnectionRequest = Database["public"]["Tables"]["connection_requests"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

export type ConnectionState =
  | "self"
  | "none"
  | "outgoing"
  | "incoming"
  | "connected"
  | "rejected";
