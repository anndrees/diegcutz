import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendBookingConfirmation } from "@/lib/pushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, Package, Sparkles, LogIn, Gift, Music, Ticket, X, Check, Loader2 } from "lucide-react";
import { CalendarDays, Scissors, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { MobileStep } from "@/components/booking/MobileStep";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Validation schema for playlist URL
const playlistUrlSchema = z.string().max(500, "URL demasiado larga").refine(
  (val) => {
    if (!val || val.trim() === "") return true; // Empty is OK
    try {
      const url = new URL(val);
      // Only allow http/https protocols
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "Por favor ingresa una URL válida (ej: https://spotify.com/...)" }
);

type CustomExtra = {
  name: string;
  price: number;
};

type Pack = {
  id: string;
  name: string;
  price: number;
  description?: string;
  included_service_ids?: string[];
  custom_extras?: CustomExtra[];
  coming_soon?: boolean;
};

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  coming_soon?: boolean;
};

type OptionalAddon = {
  id: string;
  name: string;
  price: number;
  coming_soon: boolean;
};

type TimeRange = {
  start: string;
  end: string;
};

type BusinessHour = {
  day_of_week: number;
  is_closed: boolean;
  is_24h: boolean;
  time_ranges: TimeRange[];
};

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, checkAccountStatus, signOut } = useAuth();
  const isMobile = useIsMobile();
  const hoursRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [optionalAddons, setOptionalAddons] = useState<OptionalAddon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isFreeCutReservation, setIsFreeCutReservation] = useState(false);
  const [restrictionTimeLeft, setRestrictionTimeLeft] = useState<string>("");
  const [playlistUrl, setPlaylistUrl] = useState<string>("");
  const [playlistUrlError, setPlaylistUrlError] = useState<string>("");
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3 | 4>(1);
  const [blockSameDayEnabled, setBlockSameDayEnabled] = useState(false);
  const [blockSameDayFromHour, setBlockSameDayFromHour] = useState(13);
  const [membershipDiscount, setMembershipDiscount] = useState(0);
  const [membershipFreeServices, setMembershipFreeServices] = useState(0);
  const [useMembershipService, setUseMembershipService] = useState(false);
  const [membershipName, setMembershipName] = useState("");
  
  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string>("");

  // Check account status on mount and periodically
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      
      const status = await checkAccountStatus();
      
      if (status.isBanned) {
        toast({
          title: "Cuenta suspendida",
          description: status.banReason,
          variant: "destructive",
        });
        await signOut();
        navigate("/auth");
        return;
      }
      
      if (status.isRestricted && status.restrictionEndsAt) {
        const endTime = new Date(status.restrictionEndsAt);
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setRestrictionTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Mobile wizard auto-advance + scroll-to-top on step change
  useEffect(() => {
    if (!isMobile) return;
    if (selectedDate && mobileStep === 1) setMobileStep(2);
  }, [selectedDate, isMobile]);
  useEffect(() => {
    if (!isMobile) return;
    if (selectedTime && mobileStep === 2) setMobileStep(3);
  }, [selectedTime, isMobile]);
  useEffect(() => {
    if (!isMobile) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mobileStep, isMobile]);

  // Check if this is a free cut reservation from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("free_cut") === "true") {
      setIsFreeCutReservation(true);
    }
  }, [location.search]);

  // Load services, packs and business hours from database
  useEffect(() => {
    loadServicesFromDB();
    loadBusinessHours();
    loadSameDaySettings();
    loadMembershipBenefits();
  }, []);

  const loadBusinessHours = async () => {
    const { data, error } = await supabase
      .from("business_hours")
      .select("*")
      .order("day_of_week");

    if (!error && data) {
      const formatted = data.map(d => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? d.time_ranges as TimeRange[] : []
      }));
      setBusinessHours(formatted);
    }
  };

  const loadSameDaySettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["block_same_day_enabled", "block_same_day_from_hour"]);

    if (data) {
      data.forEach((item) => {
        if (item.key === "block_same_day_enabled") {
          setBlockSameDayEnabled(item.value === true);
        } else if (item.key === "block_same_day_from_hour") {
          setBlockSameDayFromHour(typeof item.value === "number" ? item.value : 13);
        }
      });
    }
  };

  const loadMembershipBenefits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_memberships")
      .select("free_services_remaining, membership:memberships(name, product_discount_percent)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (data) {
      const membership = Array.isArray(data.membership) ? data.membership[0] : data.membership;
      setMembershipDiscount((membership as any)?.product_discount_percent || 0);
      setMembershipFreeServices(data.free_services_remaining || 0);
      setMembershipName((membership as any)?.name || "");
    }
  };

  const loadServicesFromDB = async () => {
    setLoadingServices(true);
    
    // Load services
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading services:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
      setLoadingServices(false);
      return;
    }

    if (data) {
      // Services - show ALL but mark coming_soon ones
      const dbServices = data.filter(s => s.service_type === 'service').map(s => ({
        id: s.id,
        name: s.name,
        price: parseFloat(s.price.toString()),
        description: s.description || undefined,
        coming_soon: s.coming_soon || false,
      }));
      
      // Packs - show ALL but mark coming_soon ones, include custom_extras
      const dbPacks = data.filter(s => s.service_type === 'pack').map(s => ({
        id: s.id,
        name: s.name,
        price: parseFloat(s.price.toString()),
        description: s.description || undefined,
        included_service_ids: s.included_service_ids || [],
        custom_extras: Array.isArray(s.custom_extras) ? s.custom_extras as CustomExtra[] : [],
        coming_soon: s.coming_soon || false,
      }));
      
      setServices(dbServices);
      setPacks(dbPacks);
    }

    // Load optional addons
    const { data: addonsData } = await supabase
      .from("optional_addons")
      .select("*")
      .order("name");
    
    if (addonsData) {
      setOptionalAddons(addonsData as OptionalAddon[]);
    }

    setLoadingServices(false);
  };

  // Restore booking state from localStorage if redirected from auth
  useEffect(() => {
    const savedBookingState = localStorage.getItem("pendingBooking");
    if (savedBookingState && user) {
      const state = JSON.parse(savedBookingState);
      setSelectedDate(state.date ? new Date(state.date) : undefined);
      setSelectedTime(state.time || "");
      setSelectedServices(state.services || []);
      setSelectedPack(state.pack || null);
      localStorage.removeItem("pendingBooking");
      
      // Check if the saved time is still available
      if (state.date && state.time) {
        checkTimeAvailability(new Date(state.date), state.time);
      }
    }
  }, [user]);

  const checkTimeAvailability = async (date: Date, time: string) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", format(date, "yyyy-MM-dd"))
      .or("is_cancelled.is.null,is_cancelled.eq.false");

    if (!error && data) {
      const bookedTimesForDate = data.map((b) => b.booking_time);
      if (bookedTimesForDate.includes(time)) {
        toast({
          title: "Hora no disponible",
          description: "La hora que habías seleccionado ya no está disponible. Por favor selecciona otra.",
          variant: "destructive",
        });
        setSelectedTime("");
        setSelectedDate(undefined);
        setSelectedServices([]);
        setSelectedPack(null);
      }
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadBookedTimes();
    }
  }, [selectedDate]);

  const loadBookedTimes = async () => {
    if (!selectedDate) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", format(selectedDate, "yyyy-MM-dd"))
      .or("is_cancelled.is.null,is_cancelled.eq.false");

    if (error) {
      console.error("Error loading bookings:", error);
      return;
    }

    setBookedTimes(data.map((b) => b.booking_time));
  };

  // Returns available 1h slots as minutes-from-midnight, considering:
  // - exact range start times (supports non-:00 starts like 14:40)
  // - slot must fully fit inside its range (slot + 60 <= range.end)
  // - overlaps with existing bookings (each booking occupies 60 min)
  // - 30-min safety buffer for today
  const toMinutes = (hhmm: string): number => {
    const [h, m] = hhmm.split(":").map((n) => parseInt(n));
    return (h || 0) * 60 + (m || 0);
  };

  const getAvailableHours = (): number[] => {
    if (!selectedDate || businessHours.length === 0) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    if (!dayConfig || dayConfig.is_closed) return [];

    const slotsSet: Set<number> = new Set();

    if (dayConfig.is_24h) {
      for (let h = 0; h < 23; h++) slotsSet.add(h * 60);
    } else {
      dayConfig.time_ranges.forEach(range => {
        const startMin = toMinutes(range.start);
        const endMin = toMinutes(range.end);
        // Generate 60-min slots starting at range.start, step 60, must fit fully
        for (let s = startMin; s + 60 <= endMin; s += 60) {
          slotsSet.add(s);
        }
      });
    }

    // Filter out slots that overlap with any existing booking (bookings last 60 min)
    const bookedMinutes = bookedTimes.map((t) => toMinutes(t));
    let slots = Array.from(slotsSet).filter((s) => {
      // overlap if |s - b| < 60 for any booked b
      return !bookedMinutes.some((b) => Math.abs(s - b) < 60);
    });

    // For today: 30-min buffer
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      slots = slots.filter((s) => s - currentMinutes >= 30);
    }

    return slots.sort((a, b) => a - b);
  };

  const isDayDisabled = (date: Date): boolean => {
    // Past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    // Closed days
    if (isDayClosed(date)) return true;
    
    // Same-day blocking logic
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday && blockSameDayEnabled) {
      const currentHour = now.getHours();
      if (currentHour >= blockSameDayFromHour) return true;
    }
    
    return false;
  };

  const isDayClosed = (date: Date): boolean => {
    if (businessHours.length === 0) return false;
    const dayOfWeek = date.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    return dayConfig?.is_closed ?? false;
  };

  const handlePackChange = (packId: string) => {
    if (isFreeCutReservation) return; // Cannot select packs for free cut
    
    if (selectedPack === packId) {
      setSelectedPack(null);
      return;
    }
    setSelectedPack(packId);
    // Remove services included in the pack
    const pack = packs.find(p => p.id === packId);
    if (pack && pack.included_service_ids) {
      setSelectedServices(selectedServices.filter(s => !pack.included_service_ids!.includes(s)));
    }
  };

  const handleServiceChange = (serviceId: string) => {
    // For free cut, DEGRADADO and VACIAR are pre-selected and cannot be deselected
    if (isFreeCutReservation) {
      const service = services.find(s => s.id === serviceId);
      if (service && (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"))) {
        return; // Cannot toggle these for free cut
      }
    }
    
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const isServiceDisabled = (serviceId: string) => {
    if (!selectedPack) return false;
    const pack = packs.find(p => p.id === selectedPack);
    return pack && pack.included_service_ids ? pack.included_service_ids.includes(serviceId) : false;
  };

  // Get the IDs of DEGRADADO and VACIAR/TEXTURIZADO services for free cut
  const getFreeCutServiceIds = (): string[] => {
    return services
      .filter(s => s.name.includes("DEGRADADO") || s.name.includes("VACIAR") || s.name.includes("TEXTURIZADO"))
      .map(s => s.id);
  };

  // Auto-select free cut services
  useEffect(() => {
    if (isFreeCutReservation && services.length > 0) {
      const freeCutIds = getFreeCutServiceIds();
      setSelectedServices(prev => {
        const combined = new Set([...prev, ...freeCutIds]);
        return Array.from(combined);
      });
    }
  }, [isFreeCutReservation, services]);

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
  };

  const getSelectedItems = () => {
    const items: string[] = [];
    
    if (selectedPack) {
      const pack = packs.find(p => p.id === selectedPack);
      if (pack) items.push(`${pack.name} (${pack.price}€)`);
    }
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        if (isFreeCutReservation && (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"))) {
          items.push(`${service.name} (GRATIS - Corte gratis)`);
        } else {
          items.push(`${service.name} (${service.price}€)`);
        }
      }
    });
    
    // Add selected addons
    selectedAddons.forEach(addonId => {
      const addon = optionalAddons.find(a => a.id === addonId);
      if (addon) {
        if (membershipDiscount > 0) {
          const discounted = Math.round((addon.price * (1 - membershipDiscount / 100)) * 100) / 100;
          items.push(`${addon.name} (${discounted}€ — ${membershipDiscount}% dto. membresía)`);
        } else {
          items.push(`${addon.name} (${addon.price}€)`);
        }
      }
    });
    
    return items;
  };

  const handleAddonChange = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(id => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };

  // Coupon functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setCouponError("");
    
    const subtotal = calculateSubtotal();
    
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: couponCode.trim(),
      p_user_id: user?.id || null,
      p_total: subtotal
    });
    
    setCouponLoading(false);
    
    if (error) {
      setCouponError("Error al validar el cupón");
      return;
    }
    
    const result = data as { valid: boolean; error?: string; coupon_id?: string; code?: string; description?: string; discount_type?: string; discount_value?: number };
    
    if (!result.valid) {
      setCouponError(result.error || "Cupón no válido");
      return;
    }
    
    setAppliedCoupon({
      id: result.coupon_id!,
      code: result.code!,
      description: result.description || null,
      discount_type: result.discount_type!,
      discount_value: result.discount_value!
    });
    setCouponCode("");
    toast({
      title: "¡Cupón aplicado!",
      description: `Descuento de ${result.discount_type === 'percentage' ? result.discount_value + '%' : result.discount_value + '€'} aplicado`,
    });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const calculateSubtotal = () => {
    let total = 0;
    
    if (selectedPack) {
      const pack = packs.find(p => p.id === selectedPack);
      if (pack) total += pack.price;
    }
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        if (isFreeCutReservation && (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"))) {
          // Free!
        } else {
          total += service.price;
        }
      }
    });
    
    selectedAddons.forEach(addonId => {
      const addon = optionalAddons.find(a => a.id === addonId);
      if (addon) {
        const discountedPrice = membershipDiscount > 0 
          ? Math.round((addon.price * (1 - membershipDiscount / 100)) * 100) / 100 
          : addon.price;
        total += discountedPrice;
      }
    });
    
    return total;
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = calculateSubtotal();
    
    if (appliedCoupon.discount_type === 'percentage') {
      return Math.round((subtotal * appliedCoupon.discount_value / 100) * 100) / 100;
    }
    
    return Math.min(appliedCoupon.discount_value, subtotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user || !profile) {
      // Save booking state to localStorage
      const bookingState = {
        date: selectedDate?.toISOString(),
        time: selectedTime,
        services: selectedServices,
        pack: selectedPack,
      };
      localStorage.setItem("pendingBooking", JSON.stringify(bookingState));
      
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para completar tu reserva",
      });
      
      navigate("/auth", { state: { from: "/booking" } });
      return;
    }

    // Check for restriction
    const status = await checkAccountStatus();
    
    if (status.isBanned) {
      toast({
        title: "Cuenta suspendida",
        description: status.banReason,
        variant: "destructive",
      });
      await signOut();
      navigate("/auth");
      return;
    }
    
    if (status.isRestricted && status.restrictionEndsAt) {
      const endTime = new Date(status.restrictionEndsAt);
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        toast({
          title: "No puedes reservar",
          description: `Tu cuenta está temporalmente restringida. Podrás volver a reservar en ${hours}h ${minutes}m ${seconds}s`,
          variant: "destructive",
        });
        return;
      }
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Por favor selecciona fecha y hora",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPack && selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un servicio o pack",
        variant: "destructive",
      });
      return;
    }

    // Validate playlist URL
    const playlistValidation = playlistUrlSchema.safeParse(playlistUrl);
    if (!playlistValidation.success) {
      setPlaylistUrlError(playlistValidation.error.errors[0]?.message || "URL no válida");
      toast({
        title: "Error",
        description: "Por favor corrige el enlace de la playlist",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const totalPrice = calculateTotal();
    const servicesData = getSelectedItems();

    // If this is a free cut reservation, deduct from loyalty_rewards
    if (isFreeCutReservation) {
      // Get current free_cuts_available and decrement
      const { data: loyaltyData } = await supabase
        .from("loyalty_rewards")
        .select("free_cuts_available")
        .eq("user_id", user.id)
        .single();

      if (loyaltyData && loyaltyData.free_cuts_available > 0) {
        await supabase
          .from("loyalty_rewards")
          .update({ free_cuts_available: loyaltyData.free_cuts_available - 1 })
          .eq("user_id", user.id);
      }
    }

    // Check if time slot is still available before inserting
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_date", format(selectedDate, "yyyy-MM-dd"))
      .eq("booking_time", selectedTime)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .limit(1);

    if (existingBooking && existingBooking.length > 0) {
      setLoading(false);
      toast({
        title: "Hora no disponible",
        description: "Esta hora acaba de ser reservada. Por favor elige otra.",
        variant: "destructive",
      });
      loadBookedTimes();
      return;
    }

    const discountAmount = calculateDiscount();
    const originalPrice = calculateSubtotal();

    const { data: bookingData, error } = await supabase.from("bookings").insert({
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: selectedTime,
      client_name: profile.full_name,
      client_contact: profile.contact_value,
      services: servicesData,
      total_price: totalPrice,
      original_price: originalPrice,
      discount_amount: discountAmount,
      coupon_id: appliedCoupon?.id || null,
      user_id: user.id,
      playlist_url: playlistUrl || null,
    }).select().single();

    // Record coupon use if applied
    if (!error && bookingData && appliedCoupon) {
      await supabase.from("coupon_uses").insert({
        coupon_id: appliedCoupon.id,
        user_id: user.id,
        booking_id: bookingData.id,
        discount_applied: discountAmount,
      });
    }

    if (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: "No se pudo completar la reserva. Inténtalo de nuevo.",
        variant: "destructive",
      });
      loadBookedTimes();
      return;
    }

    // Send email notification
    try {
      await supabase.functions.invoke('send-booking-email', {
        body: {
          clientName: profile.full_name,
          clientContact: profile.contact_value,
          bookingDate: format(selectedDate, "yyyy-MM-dd"),
          bookingTime: selectedTime,
          services: servicesData,
          totalPrice,
          isFreeCut: isFreeCutReservation,
          playlistUrl: playlistUrl || undefined,
        },
      });
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
    }

    // Send push notification confirmation
    try {
      await sendBookingConfirmation(
        user.id,
        format(selectedDate, "yyyy-MM-dd"),
        selectedTime,
        servicesData
      );
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
    }

    setLoading(false);

    const message = isFreeCutReservation 
      ? `¡Tu corte gratis está confirmado! Te esperamos el ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}.`
      : `Te esperamos el ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}. Total: ${totalPrice}€`;

    toast({
      title: "¡Reserva confirmada!",
      description: message,
    });

    // Reset form
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedServices([]);
    setSelectedPack(null);
    setIsFreeCutReservation(false);
    setPlaylistUrl("");
    setPlaylistUrlError("");
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    
    // Navigate to home after booking
    navigate("/");
  };

  const availableHours = getAvailableHours();
  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen py-12 px-4 pt-safe relative overflow-hidden">
      {/* Decorative neon background */}
      <div className="pointer-events-none absolute inset-0 bg-neon-grid opacity-40" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-neon-purple/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-neon-cyan/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-5xl mx-auto relative">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 hover:text-neon-cyan transition-colors"
        >
          <ArrowLeft className="mr-2" />
          Volver
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {isFreeCutReservation ? (
            <>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 border border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                <Gift className="h-5 w-5" />
                <span className="font-bold">CORTE GRATIS</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-4 text-neon-cyan font-aggressive">
                ¡TU CORTE GRATIS!
              </h1>
              <p className="text-xl text-muted-foreground">
                Incluye DEGRADADO + VACIAR/TEXTURIZADO. Puedes añadir servicios extra.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-black mb-4 text-neon-purple font-aggressive">
                RESERVA TU CITA
              </h1>
              <p className="text-xl text-muted-foreground">
                Elige tu fecha, hora y servicios en pocos pasos
              </p>
            </>
          )}
        </motion.div>

        {/* Stepper — desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-10 hidden md:flex items-center justify-center gap-2 sm:gap-4"
        >
          {[
            { n: 1, label: "Fecha", icon: CalendarDays, active: !!selectedDate },
            { n: 2, label: "Hora", icon: Clock, active: !!selectedTime },
            { n: 3, label: "Servicios", icon: Scissors, active: !!(selectedPack || selectedServices.length > 0) },
            { n: 4, label: "Confirmar", icon: CheckCircle2, active: false },
          ].map((step, i, arr) => (
            <div key={step.n} className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    step.active
                      ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-[0_0_20px_hsl(var(--neon-cyan)/0.6)]'
                      : 'border-border bg-card/40 text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${step.active ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`h-[2px] w-6 sm:w-12 transition-all duration-500 ${arr[i + 1].active || step.active ? 'bg-gradient-to-r from-neon-purple to-neon-cyan' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Mobile wizard header */}
        {isMobile && (
          <div className="md:hidden mb-6 sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/85 backdrop-blur-xl border-b border-neon-cyan/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Paso {mobileStep} de 4
              </span>
              <span className="text-sm font-black uppercase text-neon-cyan font-aggressive tracking-wider">
                {mobileStep === 1 && "Fecha"}
                {mobileStep === 2 && "Hora"}
                {mobileStep === 3 && "Servicios"}
                {mobileStep === 4 && "Confirmar"}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-cyan shadow-[0_0_12px_hsl(var(--neon-cyan)/0.8)]"
                initial={false}
                animate={{ width: `${(mobileStep / 4) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    // Allow going back; only allow forward if previous steps complete
                    if (n < mobileStep) setMobileStep(n as 1 | 2 | 3 | 4);
                    else if (n === 2 && selectedDate) setMobileStep(2);
                    else if (n === 3 && selectedDate && selectedTime) setMobileStep(3);
                    else if (n === 4 && selectedDate && selectedTime && (selectedPack || selectedServices.length > 0)) setMobileStep(4);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    n === mobileStep ? "bg-neon-cyan scale-150 shadow-[0_0_8px_hsl(var(--neon-cyan))]" : n < mobileStep ? "bg-neon-cyan/60" : "bg-border"
                  }`}
                  aria-label={`Ir al paso ${n}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Restriction Alert */}
        {profile?.is_restricted && restrictionTimeLeft && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg shadow-[0_0_30px_rgb(234_179_8/0.3)]"
          >
            <div className="flex items-center gap-2 text-yellow-500 font-bold mb-1">
              <span>⚠️ CUENTA RESTRINGIDA</span>
            </div>
            <p className="text-muted-foreground">
              No puedes hacer reservas temporalmente. Podrás volver a reservar en:{" "}
              <span className="font-mono text-yellow-500">{restrictionTimeLeft}</span>
            </p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 pb-24 md:pb-0">
          {/* Calendar — Step 1 on mobile */}
          <MobileStep isMobile={isMobile} active={mobileStep === 1} step={1} currentStep={mobileStep}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-card/60 backdrop-blur-xl border-neon-purple/30 shadow-[0_0_40px_hsl(var(--neon-purple)/0.15)] hover:shadow-[0_0_60px_hsl(var(--neon-purple)/0.3)] transition-shadow duration-500 overflow-hidden">
              <CardHeader className="border-b border-neon-purple/20 bg-gradient-to-r from-neon-purple/10 to-transparent">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                  <CalendarDays className="text-neon-purple" />
                  Selecciona una fecha
                </CardTitle>
                <CardDescription>Los días cerrados no están disponibles</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center overflow-x-auto p-4 pt-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDayDisabled}
                  className="rounded-md pointer-events-auto scale-90 sm:scale-100"
                />
              </CardContent>
            </Card>
          </motion.div>
          </MobileStep>

          {/* Time Selection — Step 2 on mobile */}
          <MobileStep isMobile={isMobile} active={mobileStep === 2} step={2} currentStep={mobileStep}>
          <div className="space-y-6" ref={hoursRef}>
            <AnimatePresence mode="wait">
              {selectedDate && (
                <motion.div
                  key={selectedDate.toISOString()}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-card/60 backdrop-blur-xl border-neon-cyan/30 shadow-[0_0_40px_hsl(var(--neon-cyan)/0.15)] hover:shadow-[0_0_60px_hsl(var(--neon-cyan)/0.3)] transition-shadow duration-500 overflow-hidden">
                    <CardHeader className="border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/10 to-transparent">
                      <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                        <Clock className="text-neon-cyan animate-pulse" />
                        Horas disponibles
                      </CardTitle>
                      <CardDescription className="text-sm md:text-base capitalize">
                        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-6">
                      {availableHours.length === 0 ? (
                        <p className="text-destructive py-4 text-center">Cerrado este día</p>
                      ) : (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            visible: { transition: { staggerChildren: 0.03 } },
                          }}
                          className="grid grid-cols-3 sm:grid-cols-3 gap-2"
                        >
                          {availableHours.map((slotMin) => {
                            const hh = Math.floor(slotMin / 60).toString().padStart(2, "0");
                            const mm = (slotMin % 60).toString().padStart(2, "0");
                            const timeString = `${hh}:${mm}:00`;
                            const label = `${hh}:${mm}`;
                            const isBooked = bookedTimes.includes(timeString);
                            const isSelected = selectedTime === timeString;

                            return (
                              <motion.button
                                key={slotMin}
                                variants={{
                                  hidden: { opacity: 0, y: 10 },
                                  visible: { opacity: 1, y: 0 },
                                }}
                                whileHover={!isBooked ? { scale: 1.05, y: -2 } : {}}
                                whileTap={!isBooked ? { scale: 0.95 } : {}}
                                disabled={isBooked}
                                onClick={() => !isBooked && setSelectedTime(timeString)}
                                className={`relative h-12 sm:h-14 rounded-lg font-bold text-sm sm:text-base font-mono tracking-wider border-2 transition-all duration-300 overflow-hidden group ${
                                  isBooked
                                    ? 'border-destructive/30 bg-destructive/5 text-muted-foreground cursor-not-allowed'
                                    : isSelected
                                    ? 'border-neon-cyan bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 text-foreground shadow-[0_0_25px_hsl(var(--neon-cyan)/0.6)]'
                                    : 'border-border/60 bg-card/40 text-foreground hover:border-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan'
                                }`}
                              >
                                {isSelected && !isBooked && (
                                  <motion.span
                                    layoutId="selectedTimeGlow"
                                    className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20"
                                  />
                                )}
                                <span className={`relative z-10 ${isBooked ? 'line-through opacity-50' : ''}`}>
                                  {label}
                                </span>
                                {isBooked && (
                                  <span className="absolute top-1 right-1 text-[8px] font-black uppercase text-destructive/80 z-10">
                                    ✕
                                  </span>
                                )}
                                {!isBooked && !isSelected && (
                                  <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                                )}
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </MobileStep>
        </div>

        {/* Services Selection */}
        <AnimatePresence>
        {selectedTime && !loadingServices && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 space-y-6 pb-24 md:pb-0"
          >
            <MobileStep isMobile={isMobile} active={mobileStep === 3} step={3} currentStep={mobileStep}>
            <div className="space-y-6">
            {/* Packs - Hidden for free cut reservations */}
            {!isFreeCutReservation && packs.length > 0 && (
              <Card className="bg-card/60 backdrop-blur-xl border-neon-cyan/30 shadow-[0_0_40px_hsl(var(--neon-cyan)/0.1)] overflow-hidden">
                <CardHeader className="border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/10 to-transparent">
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Package className="text-neon-cyan" />
                    Selecciona un Pack
                  </CardTitle>
                  <CardDescription>Solo puedes seleccionar un pack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {packs.map((pack) => {
                    // Build the "Incluye" text with services + custom extras
                    const includedServiceNames = pack.included_service_ids?.map(sid => 
                      services.find(s => s.id === sid)?.name
                    ).filter(Boolean) || [];
                    const customExtraNames = pack.custom_extras?.map(e => e.name) || [];
                    const allIncluded = [...includedServiceNames, ...customExtraNames];
                    
                    return (
                      <div key={pack.id}>
                        <div
                          className={`p-4 border-2 rounded-lg transition-all ${
                            pack.coming_soon
                              ? 'opacity-60 cursor-not-allowed border-muted'
                              : selectedPack === pack.id
                              ? 'border-neon-cyan bg-card/50 glow-neon-cyan cursor-pointer'
                              : selectedPack && selectedPack !== pack.id
                              ? 'border-muted opacity-50 cursor-pointer'
                              : 'border-border hover:border-primary cursor-pointer'
                          }`}
                          onClick={() => !pack.coming_soon && handlePackChange(pack.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-neon-cyan">{pack.name}</h4>
                                {pack.coming_soon && (
                                  <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                                    Próximamente
                                  </span>
                                )}
                              </div>
                              {allIncluded.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Incluye: {allIncluded.join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="text-xl font-bold text-primary">{pack.price}€</span>
                          </div>
                        </div>
                        
                        {/* Show optional addons for selected packs */}
                        {selectedPack === pack.id && !pack.coming_soon && optionalAddons.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {optionalAddons.map((addon) => (
                              <div 
                                key={addon.id}
                                className={`p-3 border-2 rounded-lg transition-all ${
                                  addon.coming_soon
                                    ? 'border-dashed border-muted opacity-60'
                                    : selectedAddons.includes(addon.id)
                                    ? 'border-neon-purple bg-neon-purple/10 cursor-pointer'
                                    : 'border-border hover:border-primary cursor-pointer'
                                }`}
                                onClick={() => !addon.coming_soon && handleAddonChange(addon.id)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {!addon.coming_soon && (
                                      <Checkbox
                                        checked={selectedAddons.includes(addon.id)}
                                        onCheckedChange={() => handleAddonChange(addon.id)}
                                      />
                                    )}
                                    <div>
                                      <h5 className="font-semibold text-sm">¿Añadir {addon.name}?</h5>
                                      <p className="text-xs text-muted-foreground mt-0.5">{addon.price}€</p>
                                    </div>
                                  </div>
                                  {addon.coming_soon && (
                                    <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded">
                                      Próximamente
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services.length > 0 && (
              <Card className="bg-card/60 backdrop-blur-xl border-neon-purple/30 shadow-[0_0_40px_hsl(var(--neon-purple)/0.1)] overflow-hidden">
                <CardHeader className="border-b border-neon-purple/20 bg-gradient-to-r from-neon-purple/10 to-transparent">
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Sparkles className="text-neon-purple" />
                    {isFreeCutReservation ? "Servicios (DEGRADADO y VACIAR incluidos)" : "Servicios Adicionales"}
                  </CardTitle>
                  <CardDescription>
                    {isFreeCutReservation 
                      ? "Los servicios marcados con ✓ GRATIS están incluidos en tu corte gratis"
                      : "Puedes seleccionar varios servicios"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {services.map((service) => {
                    const isFreeCutService = isFreeCutReservation && 
                      (service.name.includes("DEGRADADO") || service.name.includes("VACIAR") || service.name.includes("TEXTURIZADO"));
                    const disabled = isServiceDisabled(service.id) || service.coming_soon;
                    
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg ${
                          disabled && !isFreeCutService
                            ? 'opacity-50 border-muted'
                            : isFreeCutService
                            ? 'border-neon-cyan bg-neon-cyan/10'
                            : selectedServices.includes(service.id)
                            ? 'border-primary bg-card/50 glow-neon-purple'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={service.id}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceChange(service.id)}
                            disabled={disabled || isFreeCutService}
                          />
                          <Label
                            htmlFor={service.id}
                            className={`text-base cursor-pointer`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{service.name}</span>
                              {isFreeCutService && (
                                <span className="text-xs font-bold text-neon-cyan uppercase bg-neon-cyan/20 px-2 py-0.5 rounded">
                                  ✓ GRATIS
                                </span>
                              )}
                              {service.coming_soon && (
                                <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                                  Próximamente
                                </span>
                              )}
                            </div>
                          </Label>
                        </div>
                        <span className={`text-lg font-bold ${isFreeCutService ? 'line-through text-muted-foreground' : ''}`}>
                          {service.price}€
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Music Selection */}
            <Card className="bg-card/60 backdrop-blur-xl border-neon-pink/30 shadow-[0_0_40px_hsl(var(--neon-pink)/0.1)] overflow-hidden">
              <CardHeader className="border-b border-neon-pink/20 bg-gradient-to-r from-neon-pink/10 to-transparent">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                  <Music className="text-neon-pink animate-pulse" />
                  Elige tu música
                </CardTitle>
                <CardDescription>
                  Añade un enlace a tu playlist favorita (Spotify, YouTube) para ponerla durante tu cita
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="playlist">Enlace de playlist (opcional)</Label>
                  <Input
                    id="playlist"
                    type="url"
                    placeholder="https://open.spotify.com/playlist/... o https://youtube.com/playlist?..."
                    value={playlistUrl}
                    onChange={(e) => {
                      setPlaylistUrl(e.target.value);
                      setPlaylistUrlError("");
                    }}
                    className={`bg-background ${playlistUrlError ? 'border-destructive' : ''}`}
                    maxLength={500}
                  />
                  {playlistUrlError ? (
                    <p className="text-xs text-destructive">{playlistUrlError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Añade tu playlist y la pondremos durante tu cita. ¡Disfruta de tu música favorita!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coupon Code */}
            {!isFreeCutReservation && (selectedPack || selectedServices.length > 0) && (
              <Card className="bg-card/60 backdrop-blur-xl border-primary/30 overflow-hidden">
                <CardHeader className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Ticket className="text-primary" />
                    Código de descuento
                  </CardTitle>
                  <CardDescription>
                    ¿Tienes un cupón promocional? Aplícalo aquí
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold text-primary">{appliedCoupon.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {appliedCoupon.discount_type === 'percentage' 
                              ? `${appliedCoupon.discount_value}% de descuento`
                              : `${appliedCoupon.discount_value}€ de descuento`
                            }
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={removeCoupon}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Introduce tu código"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          className="uppercase"
                        />
                        <Button 
                          onClick={handleApplyCoupon} 
                          disabled={couponLoading || !couponCode.trim()}
                          variant="outline"
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-destructive">{couponError}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
            </MobileStep>

            <MobileStep isMobile={isMobile} active={mobileStep === 4} step={4} currentStep={mobileStep}>
            <div className="space-y-6">
            {/* Total Price */}
            {(selectedPack || selectedServices.length > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
              <Card className={`border-0 relative overflow-hidden ${isFreeCutReservation ? 'bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20' : 'bg-gradient-neon'} shadow-[0_0_50px_hsl(var(--neon-purple)/0.4)]`}>
                {/* Animated shimmer */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
                </div>
                <CardContent className="p-6 relative">
                  {appliedCoupon && (
                    <div className={`mb-3 space-y-1 ${isFreeCutReservation ? 'text-foreground' : 'text-background/80'}`}>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{calculateSubtotal()}€</span>
                      </div>
                      <div className="flex justify-between text-sm text-primary">
                        <span>Descuento ({appliedCoupon.code}):</span>
                        <span>-{calculateDiscount()}€</span>
                      </div>
                    </div>
                  )}
                  <div className={`flex justify-between items-center ${isFreeCutReservation ? 'text-foreground' : 'text-background'}`}>
                    <div>
                      <span className="text-2xl font-black">TOTAL:</span>
                      {isFreeCutReservation && totalPrice === 0 && (
                        <p className="text-sm text-neon-cyan">¡Es tu corte gratis!</p>
                      )}
                    </div>
                    <motion.span
                      key={totalPrice}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-5xl font-black tabular-nums"
                    >
                      {totalPrice}€
                    </motion.span>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            )}

            {/* User Info / Login Prompt */}
            <Card className="bg-card/60 backdrop-blur-xl border-neon-cyan/30 shadow-[0_0_40px_hsl(var(--neon-cyan)/0.15)] overflow-hidden">
              <CardHeader className="border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/10 to-transparent">
                <CardTitle className="text-xl md:text-2xl">
                  {user && profile ? "Tu perfil" : "Inicia sesión"}
                </CardTitle>
                <CardDescription>
                  {user && profile 
                    ? "Información de tu cuenta" 
                    : "Debes iniciar sesión para completar tu reserva"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {authLoading ? (
                  <p className="text-center py-4">Cargando...</p>
                ) : user && profile ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="text-lg font-semibold">{profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contacto</p>
                      <p className="text-lg font-semibold">{profile.contact_value}</p>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      variant={isFreeCutReservation ? "neonCyan" : "neonCyan"}
                      className="w-full h-10 sm:h-12 text-sm sm:text-base"
                      disabled={loading || (!selectedPack && selectedServices.length === 0)}
                    >
                      {loading ? "Reservando..." : isFreeCutReservation ? `¡Confirmar Corte Gratis!` : `Confirmar Reserva - ${totalPrice}€`}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const bookingState = {
                        date: selectedDate?.toISOString(),
                        time: selectedTime,
                        services: selectedServices,
                        pack: selectedPack,
                      };
                      localStorage.setItem("pendingBooking", JSON.stringify(bookingState));
                      navigate("/auth", { state: { from: "/booking" } });
                    }}
                    variant="neon"
                    className="w-full h-10 sm:h-12 text-sm sm:text-base"
                  >
                    <LogIn className="mr-2" />
                    Iniciar Sesión / Registrarse
                  </Button>
                )}
              </CardContent>
            </Card>
            </div>
            </MobileStep>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div
          className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 bg-background/90 backdrop-blur-xl border-t border-neon-cyan/20"
        >
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <Button
              variant="outline"
              size="lg"
              disabled={mobileStep === 1}
              onClick={() => setMobileStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4))}
              className="flex-1 border-neon-purple/40"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
            </Button>
            <Button
              variant="neon"
              size="lg"
              disabled={
                (mobileStep === 1 && !selectedDate) ||
                (mobileStep === 2 && !selectedTime) ||
                (mobileStep === 3 && !selectedPack && selectedServices.length === 0) ||
                mobileStep === 4
              }
              onClick={() => setMobileStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4))}
              className="flex-1"
            >
              {mobileStep === 4 ? "Confirma arriba" : "Siguiente"}
              {mobileStep !== 4 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
