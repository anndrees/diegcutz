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
import { Edit2, Trash2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Service = {
  id: string;
  name: string;
  price: number;
  service_type: 'service' | 'pack';
  description?: string;
  coming_soon?: boolean;
  included_service_ids?: string[];
};

export const ServicesManagement = () => {
  const { toast } = useToast();
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
  });

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
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
      return;
    }

    setServices((data || []) as Service[]);
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
    });
  };

  const handleSave = async () => {
    if (!formData.name || formData.price <= 0) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(formData)
        .eq("id", editingService.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el servicio",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Servicio actualizado",
        description: "Los cambios se guardaron correctamente",
      });
    } else {
      const { error } = await supabase
        .from("services")
        .insert(formData);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo crear el servicio",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Servicio creado",
        description: "El servicio se creó correctamente",
      });
    }

    setEditingService(null);
    setIsCreating(false);
    loadServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este servicio?")) return;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Servicio eliminado",
      description: "El servicio se eliminó correctamente",
    });

    loadServices();
  };

  const individualServices = services.filter(s => s.service_type === 'service');
  const packs = services.filter(s => s.service_type === 'pack');

  const ServiceTable = ({ items }: { items: Service[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Estado</TableHead>
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
                <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                  Próximamente
                </span>
              ) : (
                <span className="text-xs font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded">
                  Activo
                </span>
              )}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
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
            <TabsTrigger value="services">Servicios Individuales ({individualServices.length})</TabsTrigger>
            <TabsTrigger value="packs">Packs ({packs.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="services" className="mt-4">
            {individualServices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay servicios registrados</p>
            ) : (
              <ServiceTable items={individualServices} />
            )}
          </TabsContent>
          <TabsContent value="packs" className="mt-4">
            {packs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay packs registrados</p>
            ) : (
              <ServiceTable items={packs} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingService || isCreating} onOpenChange={() => { setEditingService(null); setIsCreating(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar" : "Crear"} {formData.service_type === 'pack' ? 'Pack' : 'Servicio'}</DialogTitle>
            <DialogDescription>
              {editingService ? "Modifica" : "Crea"} los datos del {formData.service_type === 'pack' ? 'pack' : 'servicio'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service-type">Tipo</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value: 'service' | 'pack') => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Servicio Individual</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: DEGRADADO"
              />
            </div>

            <div>
              <Label htmlFor="price">Precio (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.5"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            {formData.service_type === 'pack' ? (
              <div>
                <Label htmlFor="included_services">Servicios Incluidos</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {services.filter(s => s.service_type === 'service').map(service => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={formData.included_service_ids.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ 
                              ...formData, 
                              included_service_ids: [...formData.included_service_ids, service.id] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              included_service_ids: formData.included_service_ids.filter(id => id !== service.id) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`service-${service.id}`} className="cursor-pointer">
                        {service.name} ({service.price}€)
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del servicio"
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="coming_soon"
                checked={formData.coming_soon}
                onCheckedChange={(checked) => setFormData({ ...formData, coming_soon: !!checked })}
              />
              <Label htmlFor="coming_soon" className="cursor-pointer">
                Marcar como PRÓXIMAMENTE (no seleccionable en reservas)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingService(null); setIsCreating(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="neon">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
