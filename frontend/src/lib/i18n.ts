/**
 * Lightweight i18n for balloon — English + Spanish.
 * No external dependencies. Call useT() anywhere to get typed translations.
 * Language preference is stored in localStorage and the Zustand store.
 */

export type Lang = "en" | "es";

const translations = {
  en: {
    // ── Navigation / common ───────────────────────────────────────────────────
    back:        "← Back",
    save:        "Save",
    cancel:      "Cancel",
    change:      "Change",
    add:         "+ Add",
    create:      "+ Create",
    loading:     "Loading…",
    saving:      "Saving…",
    creating:    "Creating…",
    skip:        "Skip",
    close:       "×",
    or:          "or",

    // ── Grid card ─────────────────────────────────────────────────────────────
    gridDropsBanner:  "Active badge drops from people you follow",
    gridViewDrops:    "View drops",
    gridNoCelebrations: "No celebrations coming up",
    gridNoCelebrationsSub: "Follow people and add your dates in the editor to see what's coming.",
    gridEditProfile:  "Edit your profile",
    gridUpcoming:     "Upcoming",
    gridToday:        "Today",

    // ── Calendar ──────────────────────────────────────────────────────────────
    calendarTitle:       "Calendar",
    calendarThisMonth:   "This month",
    calendarFriends:     "Friends this month",
    calendarActiveDrops: "Active drops from follows",
    calendarNone:        "No celebrations scheduled for this day.",
    calendarCelebrate:   "Celebrate",
    calendarCreateDrop:  "Create a drop for this day",
    calendarDropHint:    "Let your followers claim a badge on",

    // ── Editor ────────────────────────────────────────────────────────────────
    editorTitle:     "Edit Profile",
    tabDates:        "Dates",
    tabDrops:        "Drops",
    tabWishlist:     "Wishlist",
    tabSettings:     "Settings",

    birthday:        "Birthday",
    birthdayCurrent: "Current:",
    birthdayNotSet:  "Not set",
    birthdayMonth:   "Month *",
    birthdayDay:     "Day *",
    birthdayYear:    "Year",
    birthdayYearOpt: "(optional)",
    birthdaySave:    "Save birthday",

    eventsTitle:     "Custom Events",
    eventsEmpty:     "No custom events yet",
    eventsRecurring: "Recurring",
    eventsOneTime:   "One-time",

    wishlistTitle:   "Wishlist Items",
    wishlistEmpty:   "No wishlist items yet",
    wishlistAdd:     "Add first item",

    dropsTitle:      "My Drops",
    dropsEmpty:      "No drops yet",
    dropsEmptySub:   "Create a drop so others can claim a badge from you",
    dropsFirstDrop:  "Create first drop",
    dropsClaimed:    "claimed",
    dropsCloses:     "Closes",
    dropsActive:     "Active",
    dropsClosed:     "Closed",

    addEvent:        "Add Event",
    addWishlist:     "Add to Wishlist",
    addDrop:         "Create Drop",

    dropForEvent:         "Drop for",
    dropPromptTitle:      "Create a drop for this event?",
    dropPromptSub:        "Let followers claim a badge for",
    dropPromptSkip:       "Skip",
    dropPromptCreate:     "Create Drop",

    anniversaryToday:     "Today is your UP anniversary!",
    anniversaryTodaySub:  "You've been on LUKSO for",
    anniversaryTodayUnit: "year",
    anniversaryTodayUnit2: "years",
    anniversaryTodayCta:  "Create Anniversary Drop",
    anniversaryUpcoming:  "UP Anniversary",
    anniversaryUpcomingSub: "Your UP turns",
    anniversaryUpcomingOn: "on",
    anniversaryUpcomingCta: "Pre-create Anniversary Drop",
    anniversaryDesc:      "on LUKSO! Claim this badge to celebrate with me.",

    // ── Drop form ─────────────────────────────────────────────────────────────
    dropFormTemplates:    "Use a holiday template",
    dropFormTemplateApplied: "applied",
    dropFormTemplateBrowse: "▼ browse",
    dropFormTemplateHide: "▲ hide",
    dropFormBadgePreview: "Badge image",
    dropFormBadgeHint:    "Upload your own or pick a template above",
    dropFormName:         "Drop name *",
    dropFormNamePlaceholder: "My Birthday Drop 2026",
    dropFormDescription:  "Description",
    dropFormDescPlaceholder: "Claim this badge to celebrate with me!",
    dropFormType:         "Celebration type *",
    dropFormDate:         "Drop date *",
    dropFormClosesOn:     "Closes on",
    dropFormOptional:     "(optional)",
    dropFormMaxClaims:    "Max claims",
    dropFormUnlimited:    "∞ unlimited",
    dropFormEligibility:  "Eligibility conditions",
    dropFormEligActive:   "active",
    dropFormEligHide:     "▲ hide",
    dropFormEligConfigure: "▼ configure",
    dropFormEligHint:     "Leave everything off to let anyone claim.",
    dropFormMustFollow:   "Must follow me",
    dropFormMustFollowSub: "Claimer must follow your Universal Profile",
    dropFormMinFollowers: "Min. follower count",
    dropFormMinFollowersHint: "(0 = no minimum)",
    dropFormLsp7:         "Must hold LSP7 token (add one or more)",
    dropFormLsp8:         "Must hold LSP8 collection (add one or more)",
    dropFormAddrPlaceholder: "0x… contract address",
    dropFormAddBtn:       "Add",
    dropFormCreateBtn:    "Create Drop",

    // ── Celebration types ─────────────────────────────────────────────────────
    typeBirthday:    "Birthday",
    typeAnniversary: "UP Anniversary",
    typeHoliday:     "Global Holiday",
    typeCustom:      "Custom Event",

    // ── Drops discover / detail ───────────────────────────────────────────────
    dropsDiscoverTitle:  "Badge Drops",
    dropsDiscoverActive: "Active drops",
    dropsDiscoverAll:    "All drops",
    dropDetailClaim:     "Claim badge",
    dropDetailClaiming:  "Claiming…",
    dropDetailClaimed:   "Badge claimed!",
    dropDetailEligible:  "You can claim this badge",
    dropDetailIneligible: "You don't meet the eligibility requirements",
    dropDetailSupply:    "Supply",
    dropDetailUnlimited: "Unlimited",
    dropDetailExpires:   "Expires",
    dropDetailNeverExpires: "Never",
    dropDetailHost:      "Host",
    dropDetailRequires:  "Requires",
    dropDetailFollow:    "Follow host",
    dropDetailMinFollowers: "min. followers",

    // ── Settings ──────────────────────────────────────────────────────────────
    settingsBirthday:    "Show birthday publicly",
    settingsEvents:      "Show events publicly",
    settingsWishlist:    "Show wishlist publicly",
    settingsNotify:      "Notify followers on celebrations",
    settingsSave:        "Save settings",

    // ── Sub-view headers (Editor) ─────────────────────────────────────────────
    subAddEvent:    "Add Event",
    subAddWishlist: "Add to Wishlist",
    subAddDrop:     "Create Drop",

    // ── Event form ────────────────────────────────────────────────────────────
    eventName:          "Event name *",
    eventNamePlaceholder: "Anniversary, Graduation…",
    eventDate:          "Date *",
    eventMonth:         "Month",
    eventDay:           "Day",
    eventYear:          "Year",
    eventYearOpt:       "(opt)",
    eventType:          "Type",
    eventDesc:          "Description (optional)",
    eventDescPlaceholder: "A short note about this event",
    eventImage:         "Image (optional)",
    eventTemplatePick:  "Pick a template — preview updates as you type the title",
    eventTemplateLabel: "Template:",
    eventOrUpload:      "Or tap to upload a custom image",
    eventRemove:        "Remove",
    eventRepeats:       "Repeats annually",
    eventRepeatsSub:    "Celebrate every year on this date",
    eventSave:          "Save Event",
    eventUploading:     "Uploading…",

    // ── Wishlist form ─────────────────────────────────────────────────────────
    wishlistType:            "Type",
    wishlistTypeNFT:         "NFT (LSP8)",
    wishlistTypeToken:       "Token (LSP7)",
    wishlistTypeNote:        "Note",
    wishlistName:            "Name *",
    wishlistNamePlaceholder: "Name of the asset or item",
    wishlistContract:        "Contract address",
    wishlistTokenId:         "Token ID (optional)",
    wishlistTokenIdPlaceholder: "Specific token ID (leave blank for any)",
    wishlistDesc:            "Description (optional)",
    wishlistDescPlaceholder: "Why do you want this?",
    wishlistAddBtn:          "Add to Wishlist",

    // ── Settings form ─────────────────────────────────────────────────────────
    settingsAutoMint:        "Auto-mint annual badge",
    settingsAutoMintSub:     "Mint a badge automatically on your birthday and UP anniversary",
    settingsBirthdayVis:     "Birthday visible",
    settingsBirthdayVisSub:  "Show your birthday to followers with the Celebrations app",
    settingsEventsVis:       "Events visible",
    settingsEventsVisSub:    "Show your custom events to followers",
    settingsWishlistVis:     "Wishlist visible",
    settingsWishlistVisSub:  "Let followers see your wishlist during celebrations",
    settingsNotifySub:       "Appear in followers' calendars on your celebration days",

    // ── Drops discover ────────────────────────────────────────────────────────
    dropsFromFollows:        "From people you follow",
    dropsFromFollowsEmpty:   "No active drops from your follows right now.",
    dropsDiscover:           "Discover",
    dropsDiscoverEmpty:      "No active drops at the moment.",
    dropDetails:             "Details",
    dropClaimBadge:          "Claim Badge",
    dropClaiming:            "Claiming…",
    dropClaimedOk:           "Badge claimed successfully!",
    dropClaimFailed:         "Claim failed",
    dropNotEligible:         "Not eligible",
    dropFollowRequired:      "Follow required",
    dropFollowerReq:         "followers",

    // ── Drop detail ───────────────────────────────────────────────────────────
    dropCreatedBy:           "Created by",
    dropTotal:               "total",
    dropWindowOpens:         "Opens",
    dropWindowCloses:        "Closes",
    dropWindowNone:          "No expiry",
    dropNotFound:            "Drop not found",
    dropBackToDrops:         "Back to Drops",
    dropRequirements:        "Requirements",
    dropMustFollow:          "Must follow the host",
    dropAtLeast:             "At least",
    dropClaimedBy:           "Claimed by",
    dropFirstClaim:          "No claims yet. Be the first!",
    dropMore:                "more",

    // ── Toasts / errors ───────────────────────────────────────────────────────
    toastBirthdaySaved:  "Birthday saved!",
    toastEventAdded:     "Event added!",
    toastWishlistAdded:  "Item added to wishlist!",
    toastDropCreated:    "Drop created!",
    toastNoWallet:       "No wallet connected — open this app inside the LUKSO Grid",
    toastFailedBirthday: "Failed to save birthday",
    toastFailedEvent:    "Failed to add event",
    toastFailedWishlist: "Failed to add item",
    toastFailedDrop:     "Failed to create drop",

    // ── Grid card extra ───────────────────────────────────────────────────────
    gridBadge:            "badge",
    gridBadges:           "badges",
    gridDaysAway:         "days away",
    gridCalendar:         "Calendar",
    gridDropsBtn:         "Drops",
    gridEdit:             "Edit",
    gridWishlistBtn:      "Wishlist",
    gridCelebrationsToday: "celebrations today",
    gridActiveDropsMulti:  "active drops",

    // ── Calendar extra ────────────────────────────────────────────────────────
    calendarBirthday:     "Birthday",
    calendarClaimed:      "claimed",
    calendarCelebrations: "celebrations",

    // ── Celebration view ──────────────────────────────────────────────────────
    celebrationBack:         "← Calendar",
    celebrationMintBadge:    "Mint Badge",
    celebrationSendGreeting: "Send Greeting",
    celebrationSentToday:    "Sent today",
    celebrationGiftAsset:    "Gift Asset",
    celebrationWishlistBtn:  "Wishlist",
    celebrationTabBadges:    "Badges",
    celebrationTabCards:     "Cards",

    // ── Badge & card lists ────────────────────────────────────────────────────
    badgeListEmpty:       "No badges yet",
    cardListEmpty:        "No greeting cards received yet",

    // ── Wishlist view ─────────────────────────────────────────────────────────
    wishlistPrivate:      "Wishlist is private",
    wishlistItemsOf:      "'s wishlist",
    wishlistEditBtn:      "Edit",
    wishlistEmptyOwner:   "Add items",
    wishlistViewBtn:      "View",
    wishlistItemNFT:      "NFT",
    wishlistItemToken:    "Token",
    wishlistItemNote:     "Note",

    // ── Anniversary (dismissed state) ─────────────────────────────────────────
    anniversaryLabel:     "UP Anniversary",
    anniversaryCreateDropShort: "Create drop",
  },

  es: {
    // ── Navegación / común ────────────────────────────────────────────────────
    back:        "← Volver",
    save:        "Guardar",
    cancel:      "Cancelar",
    change:      "Cambiar",
    add:         "+ Agregar",
    create:      "+ Crear",
    loading:     "Cargando…",
    saving:      "Guardando…",
    creating:    "Creando…",
    skip:        "Omitir",
    close:       "×",
    or:          "o",

    // ── Grid card ─────────────────────────────────────────────────────────────
    gridDropsBanner:  "Drops activos de personas que sigues",
    gridViewDrops:    "Ver drops",
    gridNoCelebrations: "No hay celebraciones próximas",
    gridNoCelebrationsSub: "Sigue a personas y agrega tus fechas en el editor para ver las próximas.",
    gridEditProfile:  "Editar tu perfil",
    gridUpcoming:     "Próximas",
    gridToday:        "Hoy",

    // ── Calendario ────────────────────────────────────────────────────────────
    calendarTitle:       "Calendario",
    calendarThisMonth:   "Este mes",
    calendarFriends:     "Amigos este mes",
    calendarActiveDrops: "Drops activos de seguidos",
    calendarNone:        "No hay celebraciones programadas para este día.",
    calendarCelebrate:   "Celebrar",
    calendarCreateDrop:  "Crear un drop para este día",
    calendarDropHint:    "Permite que tus seguidores reclamen un badge el",

    // ── Editor ────────────────────────────────────────────────────────────────
    editorTitle:     "Editar perfil",
    tabDates:        "Fechas",
    tabDrops:        "Drops",
    tabWishlist:     "Wishlist",
    tabSettings:     "Ajustes",

    birthday:        "Cumpleaños",
    birthdayCurrent: "Actual:",
    birthdayNotSet:  "No definido",
    birthdayMonth:   "Mes *",
    birthdayDay:     "Día *",
    birthdayYear:    "Año",
    birthdayYearOpt: "(opcional)",
    birthdaySave:    "Guardar cumpleaños",

    eventsTitle:     "Eventos personalizados",
    eventsEmpty:     "Sin eventos personalizados",
    eventsRecurring: "Recurrente",
    eventsOneTime:   "Único",

    wishlistTitle:   "Lista de deseos",
    wishlistEmpty:   "Lista de deseos vacía",
    wishlistAdd:     "Agregar primer elemento",

    dropsTitle:      "Mis drops",
    dropsEmpty:      "Sin drops aún",
    dropsEmptySub:   "Crea un drop para que otros puedan reclamar un badge tuyo",
    dropsFirstDrop:  "Crear primer drop",
    dropsClaimed:    "reclamados",
    dropsCloses:     "Cierra",
    dropsActive:     "Activo",
    dropsClosed:     "Cerrado",

    addEvent:        "Agregar evento",
    addWishlist:     "Agregar a wishlist",
    addDrop:         "Crear drop",

    dropForEvent:         "Drop para",
    dropPromptTitle:      "¿Crear un drop para este evento?",
    dropPromptSub:        "Permite que seguidores reclamen un badge para",
    dropPromptSkip:       "Omitir",
    dropPromptCreate:     "Crear drop",

    anniversaryToday:     "¡Hoy es tu aniversario en LUKSO!",
    anniversaryTodaySub:  "Llevas",
    anniversaryTodayUnit: "año",
    anniversaryTodayUnit2: "años",
    anniversaryTodayCta:  "Crear drop de aniversario",
    anniversaryUpcoming:  "Aniversario de UP",
    anniversaryUpcomingSub: "Tu UP cumple",
    anniversaryUpcomingOn: "el",
    anniversaryUpcomingCta: "Pre-crear drop de aniversario",
    anniversaryDesc:      "en LUKSO! Reclama este badge para celebrar conmigo.",

    // ── Formulario de drop ────────────────────────────────────────────────────
    dropFormTemplates:    "Usar plantilla festiva",
    dropFormTemplateApplied: "aplicada",
    dropFormTemplateBrowse: "▼ explorar",
    dropFormTemplateHide: "▲ ocultar",
    dropFormBadgePreview: "Imagen del badge",
    dropFormBadgeHint:    "Sube tu propia imagen o elige una plantilla",
    dropFormName:         "Nombre del drop *",
    dropFormNamePlaceholder: "Mi drop de cumpleaños 2026",
    dropFormDescription:  "Descripción",
    dropFormDescPlaceholder: "¡Reclama este badge para celebrar conmigo!",
    dropFormType:         "Tipo de celebración *",
    dropFormDate:         "Fecha del drop *",
    dropFormClosesOn:     "Cierra el",
    dropFormOptional:     "(opcional)",
    dropFormMaxClaims:    "Máx. reclamaciones",
    dropFormUnlimited:    "∞ ilimitado",
    dropFormEligibility:  "Condiciones de elegibilidad",
    dropFormEligActive:   "activas",
    dropFormEligHide:     "▲ ocultar",
    dropFormEligConfigure: "▼ configurar",
    dropFormEligHint:     "Deja todo desactivado para que cualquiera pueda reclamar.",
    dropFormMustFollow:   "Debe seguirme",
    dropFormMustFollowSub: "El reclamante debe seguir tu Perfil Universal",
    dropFormMinFollowers: "Mín. de seguidores",
    dropFormMinFollowersHint: "(0 = sin mínimo)",
    dropFormLsp7:         "Debe tener token LSP7 (agrega uno o más)",
    dropFormLsp8:         "Debe tener colección LSP8 (agrega uno o más)",
    dropFormAddrPlaceholder: "0x… dirección del contrato",
    dropFormAddBtn:       "Agregar",
    dropFormCreateBtn:    "Crear drop",

    // ── Tipos de celebración ──────────────────────────────────────────────────
    typeBirthday:    "Cumpleaños",
    typeAnniversary: "Aniversario UP",
    typeHoliday:     "Festividad global",
    typeCustom:      "Evento personalizado",

    // ── Drops discover / detail ───────────────────────────────────────────────
    dropsDiscoverTitle:  "Badge Drops",
    dropsDiscoverActive: "Drops activos",
    dropsDiscoverAll:    "Todos los drops",
    dropDetailClaim:     "Reclamar badge",
    dropDetailClaiming:  "Reclamando…",
    dropDetailClaimed:   "¡Badge reclamado!",
    dropDetailEligible:  "Puedes reclamar este badge",
    dropDetailIneligible: "No cumples los requisitos de elegibilidad",
    dropDetailSupply:    "Suministro",
    dropDetailUnlimited: "Ilimitado",
    dropDetailExpires:   "Vence",
    dropDetailNeverExpires: "Nunca",
    dropDetailHost:      "Anfitrión",
    dropDetailRequires:  "Requiere",
    dropDetailFollow:    "Seguir al anfitrión",
    dropDetailMinFollowers: "seguidores mín.",

    // ── Ajustes ───────────────────────────────────────────────────────────────
    settingsBirthday:    "Mostrar cumpleaños públicamente",
    settingsEvents:      "Mostrar eventos públicamente",
    settingsWishlist:    "Mostrar wishlist públicamente",
    settingsNotify:      "Notificar seguidores en celebraciones",
    settingsSave:        "Guardar ajustes",

    // ── Toasts / errores ──────────────────────────────────────────────────────
    toastBirthdaySaved:  "¡Cumpleaños guardado!",
    toastEventAdded:     "¡Evento agregado!",
    toastWishlistAdded:  "¡Elemento agregado a la wishlist!",
    toastDropCreated:    "¡Drop creado!",
    toastNoWallet:       "Sin wallet conectada — abre esta app dentro del LUKSO Grid",
    toastFailedBirthday: "Error al guardar cumpleaños",
    toastFailedEvent:    "Error al agregar evento",
    toastFailedWishlist: "Error al agregar elemento",
    toastFailedDrop:     "Error al crear drop",

    // ── Encabezados sub-vistas (Editor) ───────────────────────────────────────
    subAddEvent:    "Agregar evento",
    subAddWishlist: "Agregar a wishlist",
    subAddDrop:     "Crear drop",

    // ── Formulario de evento ──────────────────────────────────────────────────
    eventName:          "Nombre del evento *",
    eventNamePlaceholder: "Aniversario, Graduación…",
    eventDate:          "Fecha *",
    eventMonth:         "Mes",
    eventDay:           "Día",
    eventYear:          "Año",
    eventYearOpt:       "(opc)",
    eventType:          "Tipo",
    eventDesc:          "Descripción (opcional)",
    eventDescPlaceholder: "Una nota breve sobre este evento",
    eventImage:         "Imagen (opcional)",
    eventTemplatePick:  "Elige una plantilla — la vista previa se actualiza al escribir",
    eventTemplateLabel: "Plantilla:",
    eventOrUpload:      "O toca para subir tu propia imagen",
    eventRemove:        "Quitar",
    eventRepeats:       "Se repite anualmente",
    eventRepeatsSub:    "Celebrar cada año en esta fecha",
    eventSave:          "Guardar evento",
    eventUploading:     "Subiendo…",

    // ── Formulario de wishlist ────────────────────────────────────────────────
    wishlistType:            "Tipo",
    wishlistTypeNFT:         "NFT (LSP8)",
    wishlistTypeToken:       "Token (LSP7)",
    wishlistTypeNote:        "Nota",
    wishlistName:            "Nombre *",
    wishlistNamePlaceholder: "Nombre del activo o elemento",
    wishlistContract:        "Dirección del contrato",
    wishlistTokenId:         "Token ID (opcional)",
    wishlistTokenIdPlaceholder: "Token ID específico (dejar vacío para cualquiera)",
    wishlistDesc:            "Descripción (opcional)",
    wishlistDescPlaceholder: "¿Por qué lo quieres?",
    wishlistAddBtn:          "Agregar a wishlist",

    // ── Formulario de ajustes ─────────────────────────────────────────────────
    settingsAutoMint:        "Auto-mintear badge anual",
    settingsAutoMintSub:     "Mintear un badge automáticamente en tu cumpleaños y aniversario de UP",
    settingsBirthdayVis:     "Cumpleaños visible",
    settingsBirthdayVisSub:  "Mostrar tu cumpleaños a seguidores con la app Celebrations",
    settingsEventsVis:       "Eventos visibles",
    settingsEventsVisSub:    "Mostrar tus eventos personalizados a seguidores",
    settingsWishlistVis:     "Wishlist visible",
    settingsWishlistVisSub:  "Permitir que seguidores vean tu wishlist durante celebraciones",
    settingsNotifySub:       "Aparecer en los calendarios de seguidores en tus días de celebración",

    // ── Drops discover ────────────────────────────────────────────────────────
    dropsFromFollows:        "De personas que sigues",
    dropsFromFollowsEmpty:   "Sin drops activos de tus seguidos ahora mismo.",
    dropsDiscover:           "Descubrir",
    dropsDiscoverEmpty:      "Sin drops activos en este momento.",
    dropDetails:             "Detalles",
    dropClaimBadge:          "Reclamar badge",
    dropClaiming:            "Reclamando…",
    dropClaimedOk:           "¡Badge reclamado con éxito!",
    dropClaimFailed:         "Error al reclamar",
    dropNotEligible:         "No elegible",
    dropFollowRequired:      "Seguimiento requerido",
    dropFollowerReq:         "seguidores",

    // ── Drop detail ───────────────────────────────────────────────────────────
    dropCreatedBy:           "Creado por",
    dropTotal:               "total",
    dropWindowOpens:         "Abre",
    dropWindowCloses:        "Cierra",
    dropWindowNone:          "Sin vencimiento",
    dropNotFound:            "Drop no encontrado",
    dropBackToDrops:         "Volver a drops",
    dropRequirements:        "Requisitos",
    dropMustFollow:          "Debe seguir al anfitrión",
    dropAtLeast:             "Al menos",
    dropClaimedBy:           "Reclamado por",
    dropFirstClaim:          "Sin reclamaciones aún. ¡Sé el primero!",
    dropMore:                "más",

    // ── Grid card extra ───────────────────────────────────────────────────────
    gridBadge:            "badge",
    gridBadges:           "badges",
    gridDaysAway:         "días",
    gridCalendar:         "Calendario",
    gridDropsBtn:         "Drops",
    gridEdit:             "Editar",
    gridWishlistBtn:      "Wishlist",
    gridCelebrationsToday: "celebraciones hoy",
    gridActiveDropsMulti:  "drops activos",

    // ── Calendario extra ──────────────────────────────────────────────────────
    calendarBirthday:     "Cumpleaños",
    calendarClaimed:      "reclamados",
    calendarCelebrations: "celebraciones",

    // ── Vista de celebración ──────────────────────────────────────────────────
    celebrationBack:         "← Calendario",
    celebrationMintBadge:    "Crear badge",
    celebrationSendGreeting: "Enviar saludo",
    celebrationSentToday:    "Enviado hoy",
    celebrationGiftAsset:    "Regalar activo",
    celebrationWishlistBtn:  "Lista de deseos",
    celebrationTabBadges:    "Badges",
    celebrationTabCards:     "Tarjetas",

    // ── Listas de badges y tarjetas ───────────────────────────────────────────
    badgeListEmpty:       "Sin badges aún",
    cardListEmpty:        "Sin tarjetas de saludo recibidas",

    // ── Vista de wishlist ─────────────────────────────────────────────────────
    wishlistPrivate:      "Lista de deseos privada",
    wishlistItemsOf:      " - lista de deseos",
    wishlistEditBtn:      "Editar",
    wishlistEmptyOwner:   "Agregar elementos",
    wishlistViewBtn:      "Ver",
    wishlistItemNFT:      "NFT",
    wishlistItemToken:    "Token",
    wishlistItemNote:     "Nota",

    // ── Aniversario (estado descartado) ───────────────────────────────────────
    anniversaryLabel:     "Aniversario de UP",
    anniversaryCreateDropShort: "Crear drop",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
/** Translations are accessed as plain strings at runtime. */
export type Translations = Record<TranslationKey, string>;

/** Read the stored language (localStorage → default "en"). */
export function getStoredLang(): Lang {
  try {
    const stored = localStorage.getItem("balloon_lang");
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // SSR / private browsing
  }
  return "en";
}

export function setStoredLang(lang: Lang): void {
  try {
    localStorage.setItem("balloon_lang", lang);
  } catch {
    // ignore
  }
}

/** Returns the full translation map for the given language. */
export function getTranslations(lang: Lang): Translations {
  return translations[lang] as Translations;
}
