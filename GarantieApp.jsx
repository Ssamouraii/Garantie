import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const USERS = [
  {
    id: 1,
    name: "Jean Dupont",
    email: "client@garantie.local",
    password: "client123",
    role: "client",
    company: "Dupont TP",
  },
  {
    id: 2,
    name: "Alice Martin",
    email: "sav@garantie.local",
    password: "sav123",
    role: "sav",
  },
  {
    id: 3,
    name: "Luc Bernard",
    email: "be@garantie.local",
    password: "be123",
    role: "be",
  },
  {
    id: 4,
    name: "Paul Garnier",
    email: "production@garantie.local",
    password: "prod123",
    role: "production",
  },
  {
    id: 5,
    name: "Emma Leroy",
    email: "adv@garantie.local",
    password: "adv123",
    role: "adv",
  },
];

const STATUS_LABELS = [
  "Nouveau",
  "Analyse SAV",
  "Analyse BE",
  "Validation production",
  "Validation ADV",
  "Accepté",
  "Refusé",
];

const ROLE_LABELS = {
  client: "Client",
  sav: "SAV",
  be: "Bureau d'étude",
  production: "Production",
  adv: "ADV",
};

const STORAGE_KEYS = {
  tickets: "garantie_tickets",
  machines: "garantie_machines",
  logs: "garantie_logs",
  user: "garantie_user",
};

function getStatusColor(statut) {
  switch (statut) {
    case "Accepté":
      return "bg-green-600 text-white";
    case "Refusé":
      return "bg-red-600 text-white";
    case "Validation production":
    case "Validation ADV":
      return "bg-blue-600 text-white";
    case "Analyse BE":
      return "bg-purple-600 text-white";
    case "Analyse SAV":
      return "bg-amber-500 text-black";
    default:
      return "bg-slate-500 text-white";
  }
}

function getAvailableStatusesForRole(role) {
  switch (role) {
    case "sav":
      return ["Analyse SAV", "Analyse BE", "Refusé", "Accepté"];
    case "be":
      return ["Analyse BE", "Validation production", "Refusé"];
    case "production":
      return ["Validation production", "Validation ADV", "Refusé"];
    case "adv":
      return ["Validation ADV", "Accepté", "Refusé"];
    default:
      return [];
  }
}

function canSeeTicket(role, ticket, userId) {
  if (role === "client") {
    return ticket.clientId === userId;
  }
  return ["sav", "be", "production", "adv"].includes(role);
}

function canEditTicket(role, statut) {
  if (role === "sav") {
    return ["Nouveau", "Analyse SAV", "Analyse BE"].includes(statut);
  }
  if (role === "be") {
    return ["Analyse BE"].includes(statut);
  }
  if (role === "production") {
    return ["Validation production"].includes(statut);
  }
  if (role === "adv") {
    return ["Validation ADV"].includes(statut);
  }
  return false;
}

export default function GarantieApp() {
  const [tickets, setTickets] = useState([]);
  const [machines, setMachines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [activePanel, setActivePanel] = useState("demandes");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setTickets(JSON.parse(localStorage.getItem(STORAGE_KEYS.tickets) || "[]"));
    setMachines(JSON.parse(localStorage.getItem(STORAGE_KEYS.machines) || "[]"));
    setLogs(JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || "[]"));
    setCurrentUser(JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null"));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.machines, JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(currentUser));
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.user);
  }, [currentUser]);

  const appendLog = (action, ticketId = null) => {
    if (!currentUser) {
      return;
    }

    const entry = {
      id: Date.now(),
      ticketId,
      action,
      role: currentUser.role,
      user: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setLogs((prev) => [entry, ...prev]);
  };

  const displayedTickets = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const roleTickets = tickets.filter((ticket) =>
      canSeeTicket(currentUser.role, ticket, currentUser.id)
    );

    if (selectedFilter === "Tous") {
      return roleTickets;
    }

    return roleTickets.filter((ticket) => ticket.statut === selectedFilter);
  }, [tickets, currentUser, selectedFilter]);

  const availableRoleStatuses = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    return getAvailableStatusesForRole(currentUser.role);
  }, [currentUser]);

  const roleMachines = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.role === "client") {
      return machines.filter((machine) => machine.clientId === currentUser.id);
    }

    return machines;
  }, [machines, currentUser]);

  const login = (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    const user = USERS.find(
      (candidate) =>
        candidate.email.toLowerCase() === email && candidate.password === password
    );

    if (!user) {
      setLoginError("Identifiants invalides. Veuillez réessayer.");
      return;
    }

    setCurrentUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company || "",
    });
    setLoginError("");
    setActivePanel("demandes");
    appendLog("Connexion utilisateur");
    form.reset();
  };

  const logout = () => {
    if (currentUser) {
      appendLog("Déconnexion utilisateur");
    }
    setCurrentUser(null);
    setSelectedFilter("Tous");
  };

  const handleCreateTicket = (event) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    const form = event.target;
    const files = form.files?.files;

    if (!form.modele.value || !form.numero.value || !form.description.value) {
      alert("Merci de remplir les champs obligatoires.");
      return;
    }

    const newTicket = {
      id: Date.now(),
      clientId: currentUser.id,
      clientName: currentUser.name,
      type: "Demande de garantie",
      produit: form.modele.value,
      statut: "Nouveau",
      numero: form.numero.value,
      heures: form.heures.value,
      equipement: form.equipement.value,
      description: form.description.value,
      explication: form.explication.value,
      livraison: form.livraison.value,
      miseEnService: form.miseEnService.value,
      fichiers: files ? Array.from(files).map((file) => file.name) : [],
      createdAt: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);

    setMachines((prev) => {
      const alreadyExists = prev.some(
        (machine) =>
          machine.clientId === currentUser.id && machine.numero === newTicket.numero
      );

      if (alreadyExists) {
        return prev;
      }

      return [
        {
          id: Date.now() + 1,
          clientId: currentUser.id,
          clientName: currentUser.name,
          modele: newTicket.produit,
          numero: newTicket.numero,
          heures: newTicket.heures,
          equipement: newTicket.equipement,
        },
        ...prev,
      ];
    });

    appendLog(`Création du ticket #${newTicket.id}`, newTicket.id);
    form.reset();
  };

  const updateTicketStatus = (ticketId, newStatus) => {
    if (!currentUser) {
      return;
    }

    setTickets((prevTickets) =>
      prevTickets.map((ticket) => {
        if (ticket.id !== ticketId) {
          return ticket;
        }

        if (!canEditTicket(currentUser.role, ticket.statut)) {
          return ticket;
        }

        return {
          ...ticket,
          statut: newStatus,
          lastUpdateBy: currentUser.name,
          lastUpdateRole: currentUser.role,
        };
      })
    );

    appendLog(`Statut du ticket #${ticketId} → ${newStatus}`, ticketId);
  };

  const roleFilterOptions = ["Tous", ...STATUS_LABELS];

  if (!currentUser) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Portail Garantie</h1>

        <motion.form
          className="grid gap-4 bg-white rounded-lg shadow border p-6"
          onSubmit={login}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold">Connexion utilisateur</h2>
          <Input name="email" type="email" placeholder="Adresse email" required />
          <Input
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
          />

          {loginError && <p className="text-sm text-red-600">{loginError}</p>}

          <Button type="submit" className="w-full">
            Se connecter
          </Button>

          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
            <p className="font-semibold mb-1">Comptes de démonstration :</p>
            <ul className="list-disc pl-5 space-y-1">
              {USERS.map((user) => (
                <li key={user.email}>
                  {ROLE_LABELS[user.role]} — {user.email} / {user.password}
                </li>
              ))}
            </ul>
          </div>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Portail Support & Garantie</h1>
          <p className="text-sm text-gray-600">
            Connecté en tant que <strong>{currentUser.name}</strong> ({ROLE_LABELS[currentUser.role]})
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Se déconnecter
        </Button>
      </div>

      <Tabs value={activePanel} onValueChange={setActivePanel}>
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="demandes">Demandes</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="logs">Journal</TabsTrigger>
          <TabsTrigger value="profil">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="demandes" className="space-y-6">
          {currentUser.role === "client" && (
            <motion.form
              className="grid gap-4 bg-white rounded-lg shadow border p-6"
              onSubmit={handleCreateTicket}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-bold">Nouvelle demande de garantie</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="modele" placeholder="Modèle de la machine" required />
                <Input name="numero" placeholder="N° de série" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="livraison" type="date" placeholder="Date de livraison" />
                <Input
                  name="miseEnService"
                  type="date"
                  placeholder="Date de mise en service"
                />
              </div>
              <Input name="heures" type="number" placeholder="Nombre d'heures" />
              <Input name="equipement" placeholder="Équipement associé" />
              <Textarea name="description" placeholder="Description de la panne" required />
              <Textarea name="explication" placeholder="Contexte et circonstances" />
              <Input name="files" type="file" accept="image/*,video/*" multiple />
              <Button type="submit" className="w-full md:w-fit">
                Envoyer la demande
              </Button>
            </motion.form>
          )}

          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex flex-wrap gap-2 mb-4">
              {roleFilterOptions.map((status) => (
                <Button
                  key={status}
                  variant={selectedFilter === status ? "default" : "secondary"}
                  onClick={() => setSelectedFilter(status)}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>

            <table className="min-w-full border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Modèle</th>
                  <th className="px-4 py-2 text-left">N° Série</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTickets.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                      Aucun ticket correspondant.
                    </td>
                  </tr>
                )}
                {displayedTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t align-top">
                    <td className="px-4 py-2">#{ticket.id}</td>
                    <td className="px-4 py-2">{ticket.clientName}</td>
                    <td className="px-4 py-2">{ticket.produit}</td>
                    <td className="px-4 py-2">{ticket.numero}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.statut)}`}
                      >
                        {ticket.statut}
                      </span>
                    </td>
                    <td className="px-4 py-2 max-w-sm">{ticket.description}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {availableRoleStatuses.map((status) => (
                          <Button
                            key={`${ticket.id}-${status}`}
                            size="sm"
                            variant={ticket.statut === status ? "default" : "secondary"}
                            onClick={() => updateTicketStatus(ticket.id, status)}
                            disabled={!canEditTicket(currentUser.role, ticket.statut)}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="machines">
          <div className="bg-white rounded-lg shadow p-6 border">
            <h2 className="text-xl font-semibold mb-4">Parc machines</h2>
            <table className="min-w-full border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Modèle</th>
                  <th className="px-4 py-2 text-left">N° Série</th>
                  <th className="px-4 py-2 text-left">Heures</th>
                  <th className="px-4 py-2 text-left">Équipement</th>
                </tr>
              </thead>
              <tbody>
                {roleMachines.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                      Aucune machine enregistrée.
                    </td>
                  </tr>
                )}
                {roleMachines.map((machine) => (
                  <tr key={machine.id} className="border-t">
                    <td className="px-4 py-2">{machine.clientName || "-"}</td>
                    <td className="px-4 py-2">{machine.modele}</td>
                    <td className="px-4 py-2">{machine.numero}</td>
                    <td className="px-4 py-2">{machine.heures || "-"}</td>
                    <td className="px-4 py-2">{machine.equipement || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="bg-white rounded-lg shadow p-6 border">
            <h2 className="text-xl font-semibold mb-4">Journal d'activité</h2>
            <div className="space-y-2">
              {logs.length === 0 && (
                <p className="text-gray-500">Aucune activité enregistrée.</p>
              )}
              {logs.map((entry) => (
                <div key={entry.id} className="border rounded-md p-3 text-sm bg-gray-50">
                  <p>
                    <strong>{entry.user}</strong> ({ROLE_LABELS[entry.role]}) — {entry.action}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(entry.createdAt).toLocaleString("fr-FR")}
                    {entry.ticketId ? ` · Ticket #${entry.ticketId}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profil">
          <div className="bg-white rounded-lg shadow p-6 border">
            <h2 className="text-xl font-semibold mb-4">Mon profil</h2>
            <p>
              <strong>Nom :</strong> {currentUser.name}
            </p>
            <p>
              <strong>Email :</strong> {currentUser.email}
            </p>
            <p>
              <strong>Rôle :</strong> {ROLE_LABELS[currentUser.role]}
            </p>
            {currentUser.company && (
              <p>
                <strong>Société :</strong> {currentUser.company}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
