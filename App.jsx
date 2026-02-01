import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusCircle, MapPin, TrendingUp, DollarSign, Package, Trash2, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalProfit: 0, totalItems: 0 });
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const PARAMS = {
    PAGNE_PRICE: 4000, YIELD: 6, 
    PRICE_FAN: 3000, PRICE_SM_SAC: 8000, PRICE_LG_SAC: 15000,
    MO_FAN: 1000, MO_SM_SAC: 3000, MO_LG_SAC: 8000
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '', contact: '', location: '',
    qty_fan: 0, qty_sm_sac: 0, qty_lg_sac: 0,
    transport: 0, packaging: 0, marketing: 0, financial: 0, delivery: 0, loss: 0
  });

  const fetchData = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("date", "asc")); 
      const data = await getDocs(q);
      const loadedOrders = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setOrders(loadedOrders);
      calculateStats(loadedOrders);
    } catch (err) {
      console.error("Erreur lecture", err);
      toast.error("Impossible de charger les données");
    }
  };

  const calculateStats = (data) => {
    const totalRev = data.reduce((acc, row) => acc + (row.total_revenue || 0), 0);
    const totalProf = data.reduce((acc, row) => acc + (row.net_profit || 0), 0);
    const totalIt = data.reduce((acc, row) => acc + Number(row.qty_fan||0) + Number(row.qty_sm_sac||0) + Number(row.qty_lg_sac||0), 0);
    setStats({ totalRevenue: totalRev, totalProfit: totalProf, totalItems: totalIt });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading('Enregistrement en cours...');

    try {
      const d = formData;
      const fabricUnitCost = Math.round(PARAMS.PAGNE_PRICE / PARAMS.YIELD);
      const totalItems = Number(d.qty_fan) + Number(d.qty_sm_sac) + Number(d.qty_lg_sac);
      const revenue = (d.qty_fan * PARAMS.PRICE_FAN) + (d.qty_sm_sac * PARAMS.PRICE_SM_SAC) + (d.qty_lg_sac * PARAMS.PRICE_LG_SAC);
      const costFabric = totalItems * fabricUnitCost;
      const costLabor = (d.qty_fan * PARAMS.MO_FAN) + (d.qty_sm_sac * PARAMS.MO_SM_SAC) + (d.qty_lg_sac * PARAMS.MO_LG_SAC);
      const totalExpense = Math.round(costFabric + costLabor + Number(d.transport) + Number(d.packaging) + Number(d.marketing) + Number(d.financial) + Number(d.delivery) + Number(d.loss));
      const profit = revenue - totalExpense;

      await addDoc(collection(db, "orders"), {
        ...formData,
        total_revenue: revenue, total_expense: totalExpense, net_profit: profit, createdAt: new Date()
      });

      toast.success("Vente enregistrée ! 💰", { id: loadingToast });
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        client: '', contact: '', location: '',
        qty_fan: 0, qty_sm_sac: 0, qty_lg_sac: 0,
        transport: 0, packaging: 0, marketing: 0, financial: 0, delivery: 0, loss: 0
      });
      fetchData();

    } catch (error) {
      toast.error("Erreur : " + error.message, { id: loadingToast });
    }
    setIsLoading(false);
  };

  // Système de suppression avec confirmation personnalisée
  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Vraiment supprimer ?</span>
        <div className="flex gap-2">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold transition"
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete(id);
            }}
          >
            OUI
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs font-medium transition"
            onClick={() => toast.dismiss(t.id)}
          >
            NON
          </button>
        </div>
      </div>
    ), { 
      duration: 5000,
      icon: '🗑️',
      style: { border: '1px solid #fee2e2', padding: '16px', color: '#713200' },
    });
  };

  const confirmDelete = async (id) => {
    const loadToast = toast.loading("Suppression...");
    try {
      await deleteDoc(doc(db, "orders", id));
      fetchData();
      toast.success("Vente supprimée", { id: loadToast });
    } catch (error) {
      toast.error("Erreur suppression", { id: loadToast });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatMoney = (amount) => Number(amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + " F";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <Toaster position="top-center" reverseOrder={false} />

      {/* HEADER MODIFIÉ ICI */}
      <div className="bg-indigo-900 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
              {/* Nouvelle icône TrendingUp en indigo clair */}
              <TrendingUp size={28} className="text-indigo-300" />
              Tableau de bord 8 Mars 2026 – Suivi des ventes
            </h1>
            {/* Sous-titre légèrement adapté */}
            <p className="text-indigo-200 text-sm mt-1 pl-10">Pilotage en temps réel des commandes et bénéfices</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md transition"
          >
            <PlusCircle size={20} /> Nouvelle Vente
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard icon={<DollarSign />} title="Chiffre d'Affaires" value={formatMoney(stats.totalRevenue)} color="bg-blue-600" />
          <KpiCard icon={<TrendingUp />} title="Bénéfice Net" value={formatMoney(stats.totalProfit)} color="bg-green-600" />
          <KpiCard icon={<Package />} title="Articles Vendus" value={stats.totalItems} color="bg-purple-600" />
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-xl border border-indigo-100 animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-indigo-900">Saisir une commande</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="font-bold text-sm text-gray-500 uppercase">Client</p>
                <input required name="date" type="date" value={formData.date} onChange={handleChange} className="input-field" />
                <input required name="client" placeholder="Nom Client" value={formData.client} onChange={handleChange} className="input-field" />
                <input name="contact" placeholder="Téléphone" value={formData.contact} onChange={handleChange} className="input-field" />
                <input name="location" placeholder="Lieu Livraison" value={formData.location} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-sm text-gray-500 uppercase">Production</p>
                <label className="text-xs">Qté Éventails</label>
                <input type="number" name="qty_fan" value={formData.qty_fan} onChange={handleChange} className="input-field" />
                <label className="text-xs">Qté Pts Sacs</label>
                <input type="number" name="qty_sm_sac" value={formData.qty_sm_sac} onChange={handleChange} className="input-field" />
                <label className="text-xs">Qté Grds Sacs</label>
                <input type="number" name="qty_lg_sac" value={formData.qty_lg_sac} onChange={handleChange} className="input-field" />
              </div>
              <div className="space-y-2 bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="font-bold text-sm text-red-500 uppercase">Dépenses Réelles (F)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" name="transport" placeholder="Transp." value={formData.transport} onChange={handleChange} className="input-field-sm" />
                  <input type="number" name="packaging" placeholder="Embal." value={formData.packaging} onChange={handleChange} className="input-field-sm" />
                  <input type="number" name="marketing" placeholder="Pub" value={formData.marketing} onChange={handleChange} className="input-field-sm" />
                  <input type="number" name="financial" placeholder="Frais Fin." value={formData.financial} onChange={handleChange} className="input-field-sm" />
                  <input type="number" name="delivery" placeholder="Livraison" value={formData.delivery} onChange={handleChange} className="input-field-sm" />
                  <input type="number" name="loss" placeholder="Pertes" value={formData.loss} onChange={handleChange} className="input-field-sm border-red-300 text-red-600" />
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="md:col-span-3 bg-indigo-900 text-white py-3 rounded-lg font-bold hover:bg-indigo-800 transition flex justify-center items-center gap-2">
                {isLoading ? <><Loader2 className="animate-spin"/> Envoi...</> : "Enregistrer la vente"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 h-80">
          <h3 className="text-lg font-bold mb-4 text-slate-700">Évolution du Bénéfice</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...orders]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="net_profit" stroke="#16a34a" strokeWidth={3} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Client</th>
                <th className="p-4">Articles</th>
                <th className="p-4 text-right">CA</th>
                <th className="p-4 text-right">Dépenses</th>
                <th className="p-4 text-right text-green-700">Bénéfice</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-500">{order.date}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{order.client}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10}/> {order.location}</div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {order.qty_fan > 0 && <span className="badge">Ev: {order.qty_fan}</span>}
                    {order.qty_sm_sac > 0 && <span className="badge">P.Sac: {order.qty_sm_sac}</span>}
                    {order.qty_lg_sac > 0 && <span className="badge">G.Sac: {order.qty_lg_sac}</span>}
                  </td>
                  <td className="p-4 text-right font-medium">{formatMoney(order.total_revenue)}</td>
                  <td className="p-4 text-right text-red-400">-{formatMoney(order.total_expense)}</td>
                  <td className="p-4 text-right font-bold text-green-600 bg-green-50">+{formatMoney(order.net_profit)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(order.id)} className="text-red-400 hover:text-red-700 transition p-2 bg-red-50 rounded-full">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const KpiCard = ({ icon, title, value, color }) => (
  <div className={`${color} rounded-xl p-6 text-white shadow-lg flex items-center gap-4`}>
    <div className="bg-white/20 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-white/80 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default App;