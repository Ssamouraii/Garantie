import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function GarantieApp() {
  const [tickets, setTickets] = useState([]);
  const [machines, setMachines] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [beTickets, setBeTickets] = useState([]);

  // --- Persistance locale (sauvegarde) ---
  useEffect(() => {
    const savedTickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const savedMachines = JSON.parse(localStorage.getItem("machines")) || [];
    setTickets(savedTickets);
    setMachines(savedMachines);
  }, []);

  useEffect(() => {
    localStorage.setItem("tickets", JSON.stringify(tickets));
    localStorage.setItem("machines", JSON.stringify(machines));
  }, [tickets, machines]);

  // --- Filtrage des tickets pour l'admin ---
  const filteredTickets = tickets.filter(
    (ticket) => filter === "Tous" || ticket.statut === filter
  );

  // --- Création d'un nouveau ticket ---
  const handleCreateTicket = (event) => {
    event.preventDefault();
    const form = event.target;
    const files = form.files.files;

    if (!form.modele.value || !form.numero.value || !form.description.value) {
      alert("Merci de remplir tous les champs obligatoires !");
      return;
    }

    const newTicket = {
      id: tickets.length + 1,
      type: "Demande de garantie",
      produit: form.modele.value,
      statut: "En cours",
      numero: form.numero.value,
      heures: form.heures.value,
      equipement: form.equipement.value,
      description: form.description.value,
      explication: form.explication.value,
      livraison: form.livraison.value,
      miseEnService: form.miseEnService.value,
      fichiers: files ? Array.from(files).map((file) => file.name) : [],
    };

    setTickets([...tickets, newTicket]);

    const existingMachine = machines.find((m) => m.numero === newTicket.numero);
    if (!existingMachine) {
      setMachines([
        ...machines,
        {
          id: machines.length + 1,
          modele: newTicket.produit,
          numero: newTicket.numero,
          heures: newTicket.heures,
          equipement: newTicket.equipement,
        },
      ]);
    }

    form.reset();
  };

  // --- Mise à jour du statut d'un ticket ---
  const updateTicketStatus = (ticketId, newStatus) => {
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, statut: newStatus } : ticket
      )
    );
  };

  // --- Délégation au Bureau d'Étude ---
  const delegateToBE = (ticketId) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket && !beTickets.find((t) => t.id === ticketId)) {
      setBeTickets([...beTickets, ticket]);
    }
  };

  // --- Couleurs des statuts ---
  const getStatusColor = (statut) => {
    switch (statut) {
      case "Accepté":
        return "bg-green-500 text-white";
      case "Refusé":
        return "bg-red-500 text-white";
      default:
        return "bg-yellow-400 text-black";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Portail Support & Garantie</h1>

      <Tabs defaultValue="client">
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="client">Espace Client</TabsTrigger>
          <TabsTrigger value="admin">Espace Administrateur</TabsTrigger>
          <TabsTrigger value="be">Bureau d'étude</TabsTrigger>
        </TabsList>

        {/* --- Côté Client --- */}
        <TabsContent value="client">
          <Tabs defaultValue="nouvelle">
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="nouvelle">Nouvelle demande</TabsTrigger>
              <TabsTrigger value="tickets">Mes tickets</TabsTrigger>
              <TabsTrigger value="machines">Mes machines</TabsTrigger>
              <TabsTrigger value="profil">Mon profil</TabsTrigger>
            </TabsList>

            {/* Nouvelle demande */}
            <TabsContent value="nouvelle">
              <motion.form
                className="grid gap-4 bg-white rounded-lg shadow border p-6"
                onSubmit={handleCreateTicket}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 bg-gray-100 py-3 rounded-md">
                  Demande de garantie
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="modele" placeholder="Modèle de la machine" />
                  <Input name="numero" placeholder="N° de série de la machine" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="livraison" placeholder="Date de livraison" type="date" />
                  <Input
                    name="miseEnService"
                    placeholder="Date de mise en service"
                    type="date"
                  />
                </div>
                <Input
                  name="heures"
                  placeholder="Nombre d'heures d'utilisation"
                  type="number"
                />
                <Input name="equipement" placeholder="Équipement associé" />

                <Textarea name="description" placeholder="Décrivez la panne constatée..." />
                <Textarea
                  name="explication"
                  placeholder="Expliquez comment c'est arrivé..."
                />

                <div>
                  <label className="block mb-2 font-medium">
                    Joindre des photos ou vidéos :
                  </label>
                  <Input name="files" type="file" accept="image/*,video/*" multiple />
                </div>

                <Button type="submit" className="mt-4 w-full bg-gray-700 text-white">
                  Créer la demande
                </Button>
              </motion.form>
            </TabsContent>

            {/* Tickets client */}
            <TabsContent value="tickets">
              <motion.table
                className="min-w-full border bg-white rounded-lg shadow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Modèle</th>
                    <th className="px-4 py-2 text-left">N° Série</th>
                    <th className="px-4 py-2 text-left">État</th>
                    <th className="px-4 py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t">
                      <td className="px-4 py-2">{ticket.id}</td>
                      <td className="px-4 py-2">{ticket.type}</td>
                      <td className="px-4 py-2">{ticket.produit}</td>
                      <td className="px-4 py-2">{ticket.numero}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                            ticket.statut
                          )}`}
                        >
                          {ticket.statut}
                        </span>
                      </td>
                      <td className="px-4 py-2">{ticket.description}</td>
                    </tr>
                  ))}
                </tbody>
              </motion.table>
            </TabsContent>

            {/* Machines client */}
            <TabsContent value="machines">
              <table className="min-w-full border bg-white rounded-lg shadow">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Modèle</th>
                    <th className="px-4 py-2 text-left">N° Série</th>
                    <th className="px-4 py-2 text-left">Heures</th>
                    <th className="px-4 py-2 text-left">Équipement</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr key={machine.id} className="border-t">
                      <td className="px-4 py-2">{machine.id}</td>
                      <td className="px-4 py-2">{machine.modele}</td>
                      <td className="px-4 py-2">{machine.numero}</td>
                      <td className="px-4 py-2">{machine.heures}</td>
                      <td className="px-4 py-2">{machine.equipement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>

            {/* Profil client */}
            <TabsContent value="profil">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Mes informations</h2>
                <p>
                  <strong>Nom :</strong> Dupont Jean
                </p>
                <p>
                  <strong>Email :</strong> jean.dupont@example.com
                </p>
                <Button className="mt-4">Modifier mes infos</Button>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* --- Côté Administrateur --- */}
        <TabsContent value="admin">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Tableau de bord Administrateur / SAV
            </h2>
            <div className="flex gap-2 mb-4">
              {[
                "Tous",
                "En cours",
                "Accepté",
                "Refusé",
              ].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "secondary"}
                  onClick={() => setFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Modèle</th>
                  <th className="px-4 py-2 text-left">N° Série</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t">
                    <td className="px-4 py-2">{ticket.id}</td>
                    <td className="px-4 py-2">{ticket.type}</td>
                    <td className="px-4 py-2">{ticket.produit}</td>
                    <td className="px-4 py-2">{ticket.numero}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                          ticket.statut
                        )}`}
                      >
                        {ticket.statut}
                      </span>
                    </td>
                    <td className="px-4 py-2">{ticket.description}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateTicketStatus(ticket.id, "En cours")}
                      >
                        En cours
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 text-white"
                        onClick={() => updateTicketStatus(ticket.id, "Accepté")}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 text-white"
                        onClick={() => updateTicketStatus(ticket.id, "Refusé")}
                      >
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-500 text-white"
                        onClick={() => delegateToBE(ticket.id)}
                      >
                        Déléguer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* --- Bureau d'étude --- */}
        <TabsContent value="be">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Tickets délégués au Bureau d'étude
            </h2>
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Modèle</th>
                  <th className="px-4 py-2 text-left">N° Série</th>
                  <th className="px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {beTickets.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-center">
                      Aucun ticket pour le moment.
                    </td>
                  </tr>
                )}
                {beTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t">
                    <td className="px-4 py-2">{ticket.id}</td>
                    <td className="px-4 py-2">{ticket.type}</td>
                    <td className="px-4 py-2">{ticket.produit}</td>
                    <td className="px-4 py-2">{ticket.numero}</td>
                    <td className="px-4 py-2">{ticket.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
