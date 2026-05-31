import { Building2 } from "lucide-react";
import NotificationBell from "./NotificationBell";
import ThemedSelect from "./ThemedSelect";
import { Button } from "./ui";

function TopBar({
  activeHotelContext,
  canSelectHotel,
  currentPageMeta,
  darkMode,
  hotels,
  language,
  onOpenNotificationTicket,
  onRealtimeNotification,
  onRealtimeSync,
  onSelectedHotelChange,
  onToggleDarkMode,
  onToggleLanguage,
  selectedHotelId,
  shouldShowDashboardHotelChip,
  t,
  token,
  visibleActivePage,
}) {
  return (
    <header className="ops-topbar">
      <div className="min-w-0">
        <h2 className="ops-page-title">{currentPageMeta.title}</h2>
        <p className="ops-page-subtitle">{currentPageMeta.subtitle}</p>
        {visibleActivePage === "dashboard" && shouldShowDashboardHotelChip && activeHotelContext.label && (
          <div className="ops-context-chip">
            <span className="ops-soft-icon h-9 w-9">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="ops-section-label block">{activeHotelContext.eyebrow}</span>
              <span className="block truncate text-sm font-black text-slate-900 dark:text-white">
                {activeHotelContext.label}
              </span>
            </span>
            {activeHotelContext.detail && (
              <span className="ops-hotel-chip-detail">{activeHotelContext.detail}</span>
            )}
          </div>
        )}
      </div>

      <div className="ops-topbar-actions">
        <div className="self-start sm:self-auto">
          <NotificationBell
            token={token}
            onOpenTicket={onOpenNotificationTicket}
            onRealtimeNotification={onRealtimeNotification}
            onRealtimeSync={onRealtimeSync}
            t={t}
          />
        </div>
        {canSelectHotel && (
          <ThemedSelect
            className="w-full min-w-0 sm:w-72"
            value={selectedHotelId}
            onChange={onSelectedHotelChange}
            variant="pill"
            options={[
              { value: "all", label: t("common.allHotels"), meta: t("common.groupDashboard"), prefix: "ALL" },
              ...hotels.map((hotel) => ({
                value: hotel._id || hotel.id,
                label: `${hotel.code} / ${hotel.name}`,
                meta: hotel.region || "Hotel",
                prefix: String(hotel.code || hotel.name || "HT").slice(0, 2),
              })),
            ]}
          />
        )}
        <Button
          onClick={onToggleLanguage}
          className="rounded-full px-4 py-2 text-sm font-black"
          aria-label={t("common.languageToggle")}
          title={t("common.languageToggle")}
          variant="secondary"
        >
          {language === "th" ? "TH" : "EN"}
        </Button>
        <Button
          onClick={onToggleDarkMode}
          className="rounded-full px-5 py-2 text-sm font-black"
          variant="secondary"
        >
          {darkMode ? t("common.lightMode") : t("common.darkMode")}
        </Button>
      </div>
    </header>
  );
}

export default TopBar;
