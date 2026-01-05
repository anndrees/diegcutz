import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Gift, Calendar, Trophy, Users, Clock, CheckCircle, Instagram } from "lucide-react";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";

type Giveaway = {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  prize: string;
  start_date: string;
  end_date: string;
  is_finished: boolean;
  winner_id: string | null;
  winner_name: string | null;
  winner_username: string | null;
  instagram_url: string | null;
};

const Giveaways = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [userParticipations, setUserParticipations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGiveaways();
  }, [user]);

  const loadGiveaways = async () => {
    const { data } = await supabase
      .from("giveaways")
      .select("*")
      .order("start_date", { ascending: false });

    if (data) {
      setGiveaways(data as Giveaway[]);

      // Load participant counts
      const counts: Record<string, number> = {};
      for (const g of data) {
        const { count } = await supabase
          .from("giveaway_participants")
          .select("*", { count: "exact", head: true })
          .eq("giveaway_id", g.id);
        counts[g.id] = count || 0;
      }
      setParticipantCounts(counts);
    }

    // Load user participations
    if (user) {
      const { data: participations } = await supabase
        .from("giveaway_participants")
        .select("giveaway_id")
        .eq("user_id", user.id);

      if (participations) {
        setUserParticipations(participations.map(p => p.giveaway_id));
      }
    }

    setLoading(false);
  };

  const handleParticipate = async (giveawayId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para participar",
        variant: "destructive",
      });
      navigate("/auth", { state: { from: "/giveaways" } });
      return;
    }

    const { error } = await supabase
      .from("giveaway_participants")
      .insert({ giveaway_id: giveawayId, user_id: user.id });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Ya participas", description: "Ya estás participando en este sorteo" });
      } else {
        toast({ title: "Error", description: "No se pudo registrar tu participación", variant: "destructive" });
      }
      return;
    }

    toast({ title: "¡Participando!", description: "Te has registrado en el sorteo" });
    loadGiveaways();
  };

  const getStatus = (giveaway: Giveaway) => {
    if (giveaway.is_finished || giveaway.winner_id) {
      return { label: "Finalizado", variant: "secondary" as const, icon: Trophy };
    }
    const now = new Date();
    const start = new Date(giveaway.start_date);
    const end = new Date(giveaway.end_date);
    if (isFuture(start)) return { label: "Próximamente", variant: "outline" as const, icon: Clock };
    if (isPast(end)) return { label: "Terminado", variant: "destructive" as const, icon: Clock };
    return { label: "Activo", variant: "default" as const, icon: Gift };
  };

  const canParticipate = (giveaway: Giveaway) => {
    if (giveaway.is_finished || giveaway.winner_id) return false;
    const now = new Date();
    const start = new Date(giveaway.start_date);
    const end = new Date(giveaway.end_date);
    return now >= start && now <= end;
  };

  const activeGiveaways = giveaways.filter(g => !g.is_finished && !g.winner_id && !isPast(new Date(g.end_date)));
  const pastGiveaways = giveaways.filter(g => g.is_finished || g.winner_id || isPast(new Date(g.end_date)));

  return (
    <div className="min-h-screen py-12 px-4 pt-safe">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8">
          <ArrowLeft className="mr-2" />
          Volver
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 text-neon-purple animate-fade-in">
            🎁 SORTEOS
          </h1>
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: "100ms" }}>
            ¡Participa y gana premios exclusivos!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando sorteos...</p>
          </div>
        ) : giveaways.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-bold mb-2">No hay sorteos disponibles</p>
              <p className="text-muted-foreground">¡Vuelve pronto para nuevas oportunidades!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Giveaways */}
            {activeGiveaways.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-neon-cyan flex items-center gap-2">
                  <Gift className="h-6 w-6" />
                  Sorteos Activos
                </h2>
                <div className="grid gap-6">
                  {activeGiveaways.map((giveaway, index) => {
                    const status = getStatus(giveaway);
                    const isParticipating = userParticipations.includes(giveaway.id);
                    
                    return (
                      <Card 
                        key={giveaway.id} 
                        className="bg-gradient-to-br from-card to-background border-2 border-primary/30 overflow-hidden animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-2xl text-neon-purple">{giveaway.title}</CardTitle>
                              <CardDescription className="mt-2">{giveaway.description}</CardDescription>
                            </div>
                            <Badge variant={status.variant} className="flex items-center gap-1">
                              <status.icon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4">
                            <p className="text-sm text-neon-cyan font-bold uppercase mb-1">Premio</p>
                            <p className="text-xl font-bold">{giveaway.prize}</p>
                          </div>

                          {giveaway.requirements && (
                            <div>
                              <p className="text-sm font-bold text-muted-foreground mb-1">Requisitos:</p>
                              <p className="text-sm">{giveaway.requirements}</p>
                            </div>
                          )}

                          {/* Instagram Button */}
                          {giveaway.instagram_url && (
                            <a 
                              href={giveaway.instagram_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Button 
                                variant="outline" 
                                className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white border-0 hover:opacity-90 transition-opacity"
                              >
                                <Instagram className="mr-2 h-5 w-5" />
                                Ir a la publicación del sorteo
                              </Button>
                            </a>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(giveaway.start_date), "d MMM", { locale: es })} - {format(new Date(giveaway.end_date), "d MMM yyyy", { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{participantCounts[giveaway.id] || 0} participantes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                Termina {formatDistanceToNow(new Date(giveaway.end_date), { addSuffix: true, locale: es })}
                              </span>
                            </div>
                          </div>

                          {canParticipate(giveaway) && (
                            <div className="pt-4">
                              {isParticipating ? (
                                <Button disabled className="w-full" variant="outline">
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Ya estás participando
                                </Button>
                              ) : (
                                <Button onClick={() => handleParticipate(giveaway.id)} variant="neon" className="w-full">
                                  <Gift className="mr-2 h-4 w-4" />
                                  ¡Participar!
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Giveaways */}
            {pastGiveaways.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Sorteos Finalizados
                </h2>
                <div className="grid gap-4">
                  {pastGiveaways.map((giveaway, index) => (
                    <Card 
                      key={giveaway.id} 
                      className="bg-muted/50 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{giveaway.title}</h3>
                            <p className="text-sm text-muted-foreground">{giveaway.prize}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(giveaway.start_date), "d MMM yyyy", { locale: es })} - {format(new Date(giveaway.end_date), "d MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          {giveaway.winner_username && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Ganador</p>
                              <p className="font-bold text-neon-cyan flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                @{giveaway.winner_username}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Giveaways;
