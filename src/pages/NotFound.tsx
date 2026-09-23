import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomerPage } from "@/components/customer/CustomerPage";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <CustomerPage><div className="flex min-h-[70vh] items-center justify-center bg-background px-6">
      <div className="text-center">
        <p className="customer-kicker">ERROR 404</p><h1 className="noir-title my-5">Esta página no está.</h1>
        <p className="mb-8 text-muted-foreground">Volvamos a un lugar conocido.</p>
        <Button asChild variant="premium"><Link to="/">Volver al inicio</Link></Button>
      </div>
    </div></CustomerPage>
  );
};

export default NotFound;
