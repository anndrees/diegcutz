import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Plus, X, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptionalAddonsManagement } from "./OptionalAddonsManagement";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

type CustomExtra = {
  name: string;
  price: number;
};

type Service = {
  id: string;
  name: string;
  price: number;
  service_type: 'service' | 'pack';
  description?: string;
  coming_soon?: boolean;
  included_service_ids?: string[];
  custom_extras?: CustomExtra[];
};

export const ServicesManagement = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    service_type: "service" as 'service' | 'pack',
    description: "",
    coming_soon: false,
    included_service_ids: [] as string[],
    custom_extras: [] as CustomExtra[],
  });
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; service: Service | null }>({ open: false, service: null });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("service_type", { ascending: true })
      .order("name", { ascending: true });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los servicios", variant: "destructive" });
      return;
    }

    setServices((data || []).map(s => ({
      ...s,
      custom_extras: Array.isArray(s.custom_extras) ? s.custom_extras as CustomExtra[] : []
    })) as Service[]);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      service_type: service.service_type,
      description: service.description || "",
      coming_soon: service.coming_soon || false,
      included_service_ids: service.included_service_ids || [],
      custom_extras: service.custom_extras || [],
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: "",
      price: 0,
      service_type: "service",
      description: "",
      coming_soon: false,
      included_service_ids: [],
      custom_extras: [],
    });
  };

  const handleAddCustomExtra = () => {
    if (!newExtraName) return;
    setFormData({
      ...formData,
      custom_extras: [...formData.custom_extras, { name: newExtraName, price: newExtraPrice }]
    });
    setNewExtraName("");
    setNewExtraPrice(0);
  };

  const handleRemoveCustomExtra = (index: number) => {
    setFormData({
      ...formData,
      custom_extras: formData.custom_extras.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!formData.name || formData.price < 0) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name,
      price: formData.price,
      service_type: formData.service_type,
      description: formData.description || null,
      coming_soon: formData.coming_soon,
      included_service_ids: formData.service_type === 'pack' ? formData.included_service_ids : [],
      custom_extras: formData.service_type === 'pack' ? formData.custom_extras : [],
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editingService.id);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el servicio", variant: "destructive" });
        return;
      }

      toast({ title: "Servicio actualizado", description: "Los cambios se guardaron correctamente" });
    } else {
      const { error } = await supabase.from("services").insert(payload);

      if (error) {
        toast({ title: "Error", description: "No se pudo crear el servicio", variant: "destructive" });
        return;
      }

      toast({ title: "Servicio creado", description: "El servicio se creó correctamente" });
    }

    setEditingService(null);
    setIsCreating(false);
    loadServices();
  };

  const handleDeleteClick = (service: Service) => {
    if (service.service_type === 'service') {
      const packsUsingService = services.filter(
        s => s.service_type === 'pack' && s.included_service_ids?.includes(service.id)
      );

      if (packsUsingService.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: `Este servicio está incluido en: ${packsUsingService.map(p => p.name).join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }

    setDeleteDialog({ open: true, service });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.service) return;

    const { error } = await supabase.from("services").delete().eq("id", deleteDialog.service.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el servicio", variant: "destructive" });
      setDeleteDialog({ open: false, service: null });
      return;
    }

    toast({ title: "Servicio eliminado", description: "El servicio se eliminó correctamente" });
    setDeleteDialog({ open: false, service: null });
    loadServices();
  };

  const individualServices = services.filter(s => s.service_type === 'service');
  const packs = services.filter(s => s.service_type === 'pack');

  const getServiceName = (id: string) => {
    const service = services.find(s => s.id === id);
    return service?.name || id;
  };

  const ServiceCard = ({ service }: { service: Service }) => {
    const [expanded, setExpanded] = useState(false);
    return (
      <div
        className="border border-border rounded-xl p-4 transition-all hover:border-primary/30 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{service.name}</p>
              {service.coming_soon ? (
                <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">Pronto</span>
              ) : (
                <span className="text-[10px] font-bold text-green-500 uppercase bg-green-500/10 px-1.5 py-0.5 rounded">Activo</span>
              )}
            </div>
            {service.service_type === 'pack' && service.included_service_ids && service.included_service_ids.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {service.included_service_ids.map(id => getServiceName(id)).join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold text-neon-purple">{service.price}€</span>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2" onClick={(e) => e.stopPropagation()}>
            {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
            {service.service_type === 'pack' && service.custom_extras && service.custom_extras.length > 0 && (
              <p className="text-xs text-neon-cyan">Extras: {service.custom_extras.map(e => `${e.name} (${e.price}€)`).join(", ")}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                <Edit2 className="h-3 w-3 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => handleDeleteClick(service)}>
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ServiceTable = ({ items }: { items: Service[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Estado</TableHead>
          {items[0]?.service_type === 'pack' && <TableHead>Incluye</TableHead>}
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((service) => (
          <TableRow key={service.id}>
            <TableCell className="font-medium">{service.name}</TableCell>
            <TableCell>{service.price}€</TableCell>
            <TableCell>
              {service.coming_soon ? (
                <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Próximamente</span>
              ) : (
                <span className="text-xs font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded">Activo</span>
              )}
            </TableCell>
            {service.service_type === 'pack' && (
              <TableCell>
                <div className="text-xs max-w-xs">
                  {service.included_service_ids?.map(id => getServiceName(id)).join(", ")}
                  {service.custom_extras && service.custom_extras.length > 0 && (
                    <span className="text-neon-cyan"> + {service.custom_extras.map(e => e.name).join(", ")}</span>
                  )}
                </div>
              </TableCell>
            )}
            <TableCell className="text-right space-x-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(service)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const ServiceList = ({ items }: { items: Service[] }) => {
    if (items.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No hay servicios</p>;
    }
    if (isMobile) {
      return (
        <div className="space-y-3">
          {items.map(service => <ServiceCard key={service.id} service={service} />)}
        </div>
      );
    }
    return <ServiceTable items={items} />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Servicios y Packs</CardTitle>
            <Button onClick={handleCreate} variant="neon">
              <Plus className="mr-2 h-4 w-4" />
              Crear Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">Servicios ({individualServices.length})</TabsTrigger>
              <TabsTrigger value="packs">Packs ({packs.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="services" className="mt-4">
              <ServiceList items={individualServices} />
            </TabsContent>
            <TabsContent value="packs" className="mt-4">
              <ServiceList items={packs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <OptionalAddonsManagement />

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingService || isCreating} onOpenChange={() => { setEditingService(null); setIsCreating(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar" : "Crear"} {formData.service_type === 'pack' ? 'Pack' : 'Servicio'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo</Label>
              <Select value={formData.service_type} onValueChange={(value: 'service' | 'pack') => setFormData({ ...formData, service_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Servicio Individual</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: DEGRADADO" />
            </div>

            <div>
              <Label>Precio (€)</Label>
              <Input type="number" step="0.5" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
            </div>

            {formData.service_type === 'pack' && (
              <>
                <div>
                  <Label>Servicios Incluidos</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {services.filter(s => s.service_type === 'service').map(service => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={formData.included_service_ids.includes(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, included_service_ids: [...formData.included_service_ids, service.id] });
                            } else {
                              setFormData({ ...formData, included_service_ids: formData.included_service_ids.filter(id => id !== service.id) });
                            }
                          }}
                        />
                        <Label htmlFor={`service-${service.id}`} className="cursor-pointer">{service.name} ({service.price}€)</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Extras del Pack (no vendidos por separado)</Label>
                  <div className="space-y-2 border rounded-md p-3">
                    {formData.custom_extras.map((extra, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span>{extra.name} ({extra.price}€)</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCustomExtra(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input placeholder="Nombre extra" value={newExtraName} onChange={(e) => setNewExtraName(e.target.value)} className="flex-1" />
                      <Input type="number" placeholder="€" value={newExtraPrice} onChange={(e) => setNewExtraPrice(parseFloat(e.target.value) || 0)} className="w-20" />
                      <Button variant="outline" size="sm" onClick={handleAddCustomExtra}>+</Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {formData.service_type === 'service' && (
              <div>
                <Label>Descripción</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox id="coming_soon" checked={formData.coming_soon} onCheckedChange={(checked) => setFormData({ ...formData, coming_soon: !!checked })} />
              <Label htmlFor="coming_soon" className="cursor-pointer">Marcar como PRÓXIMAMENTE</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingService(null); setIsCreating(false); }}>Cancelar</Button>
            <Button onClick={handleSave} variant="neon">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, service: deleteDialog.service })}
        title="Eliminar servicio"
        description={`¿Seguro que quieres eliminar el ${deleteDialog.service?.service_type === 'pack' ? 'pack' : 'servicio'} "${deleteDialog.service?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};