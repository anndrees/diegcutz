import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Client = {
  id: string;
  full_name: string;
  username: string;
  contact_method: string;
  contact_value: string;
  created_at: string;
};

export const ClientsManagement = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    contact_value: "",
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
      return;
    }

    setClients(data || []);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      full_name: client.full_name,
      username: client.username,
      contact_value: client.contact_value,
    });
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.username || !formData.contact_value) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (!editingClient) return;

    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", editingClient.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Cliente actualizado",
      description: "Los cambios se guardaron correctamente",
    });

    setEditingClient(null);
    loadClients();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.client) return;

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteDialog.client.id }
      });

      if (error) {
        console.error("Error calling delete-user function:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente completamente",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente eliminado",
        description: "El cliente se eliminó completamente del sistema",
      });

      loadClients();
    } catch (err) {
      console.error("Error deleting client:", err);
      toast({
        title: "Error",
        description: "Error inesperado al eliminar el cliente",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({ open: false, client: null });
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <CardTitle>Gestión de Clientes ({clients.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        ) : filteredClients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.full_name}</TableCell>
                    <TableCell>
                      <Link 
                        to={`/admin/client/${client.id}`}
                        className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                      >
                        {client.username}
                      </Link>
                    </TableCell>
                    <TableCell>{client.contact_value}</TableCell>
                    <TableCell className="capitalize">{client.contact_method}</TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, client })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Usuario"
              />
            </div>

            <div>
              <Label htmlFor="contact_value">Contacto</Label>
              <Input
                id="contact_value"
                value={formData.contact_value}
                onChange={(e) => setFormData({ ...formData, contact_value: e.target.value })}
                placeholder="Email o teléfono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="neon">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, client: deleteDialog.client })}
        title="Eliminar cliente"
        description={`¿Seguro que quieres eliminar al cliente ${deleteDialog.client?.full_name}? Esto eliminará COMPLETAMENTE al usuario, incluyendo su cuenta, reservas y todos sus datos.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </Card>
  );
};