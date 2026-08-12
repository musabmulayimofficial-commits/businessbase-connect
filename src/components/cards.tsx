import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { formatDate, timeAgo } from "@/lib/constants";
import type { EventRow, NotificationRow, Opportunity, Profile } from "@/lib/types";

export function MemberCard({ profile }: { profile: Profile }) {
  return (
    <GlassPanel hover className="animate-fade-up flex flex-col p-6">
      <div className="flex items-center gap-4">
        <Avatar path={profile.avatar_url} name={profile.full_name || "Üye"} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{profile.full_name || "İsimsiz üye"}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {profile.role || "Girişimci"}
            {profile.sector ? ` · ${profile.sector}` : ""}
          </p>
        </div>
      </div>
      {profile.city ? (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden /> {profile.city}
        </p>
      ) : null}
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {profile.bio || "Bu üye henüz bir biyografi eklememiş."}
      </p>
      <Link to="/profil/$id" params={{ id: profile.id }} className="mt-5">
        <GlassButton size="sm" className="w-full">
          Profili Gör
        </GlassButton>
      </Link>
    </GlassPanel>
  );
}

export function OpportunityCard({
  opportunity,
  author,
  actions,
}: {
  opportunity: Opportunity;
  author?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  actions?: React.ReactNode;
}) {
  return (
    <GlassPanel hover className="animate-fade-up flex flex-col p-6">
      <span className="w-fit rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-foreground">
        {opportunity.category}
      </span>
      <h3 className="mt-4 text-lg font-semibold leading-snug">{opportunity.title}</h3>
      <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {opportunity.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {opportunity.location ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden /> {opportunity.location}
          </span>
        ) : null}
        <span>{timeAgo(opportunity.created_at)}</span>
      </div>
      {author ? (
        <Link
          to="/profil/$id"
          params={{ id: author.id }}
          className="mt-5 flex items-center gap-3 border-t border-border pt-4 transition-opacity hover:opacity-80"
        >
          <Avatar path={author.avatar_url} name={author.full_name || "Üye"} size="sm" />
          <span className="text-sm text-muted-foreground">{author.full_name || "Üye"}</span>
        </Link>
      ) : null}
      {actions ? <div className="mt-4 flex gap-2">{actions}</div> : null}
    </GlassPanel>
  );
}

export function EventCard({
  event,
  participantCount,
  joined,
  onToggle,
  pending,
  canJoin,
}: {
  event: EventRow;
  participantCount: number;
  joined: boolean;
  onToggle: () => void;
  pending: boolean;
  canJoin: boolean;
}) {
  return (
    <GlassPanel hover className="animate-fade-up flex flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold leading-snug">{event.name}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden />
            {formatDate(event.event_date)} · {event.event_time.slice(0, 5)}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-glass-2 px-3 py-1 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden /> {participantCount}
        </span>
      </div>
      {event.location ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden /> {event.location}
        </p>
      ) : null}
      <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {event.description}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">Organizatör: {event.organizer_name}</p>
      {canJoin ? (
        <GlassButton
          onClick={onToggle}
          loading={pending}
          variant={joined ? "glass" : "primary"}
          size="sm"
          className="mt-5"
        >
          {joined ? "Katılımdan Ayrıl" : "Etkinliğe Katıl"}
        </GlassButton>
      ) : (
        <Link to="/giris-yap" className="mt-5">
          <GlassButton size="sm" className="w-full">
            Katılmak için giriş yap
          </GlassButton>
        </Link>
      )}
    </GlassPanel>
  );
}

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: NotificationRow;
  onRead: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onRead(notification.id)}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        notification.is_read
          ? "border-transparent bg-transparent hover:bg-glass-1"
          : "border-primary/30 bg-primary/10 hover:bg-primary/15"
      }`}
    >
      <p className="text-sm font-medium">{notification.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.body}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{timeAgo(notification.created_at)}</p>
    </button>
  );
}

export function MessagePreview({
  name,
  avatar,
  lastMessage,
  time,
  unread,
  active,
  onClick,
}: {
  name: string;
  avatar?: string | null | undefined;
  lastMessage: string;
  time?: string | undefined;
  unread: number;
  active?: boolean | undefined;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
        active ? "bg-glass-3" : "hover:bg-glass-2"
      }`}
    >
      <Avatar path={avatar} name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {time ? (
            <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(time)}</span>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{lastMessage}</p>
      </div>
      {unread > 0 ? (
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {unread}
        </span>
      ) : null}
    </button>
  );
}
