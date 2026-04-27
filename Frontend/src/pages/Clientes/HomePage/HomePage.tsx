import React, { useEffect, useMemo, useState } from "react";

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (error) return <p>{error}</p>;

return (
    <div className="mt-4">
      <h2 className="mb-4">Home Page Clientes</h2>

   
    </div>
);
}
export default HomePage;