import React, { useState } from 'react';
import { DollarSign, Users, FileText, TrendingUp, Plus, Search, Filter, X, Check, Clock, AlertCircle, MapPin, Navigation } from 'lucide-react';

const InvoiceManagerApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({});
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Data states
  const [clients, setClients] = useState([
    { id: 1, name: 'ABC Company', email: 'contact@abc.com', phone: '(555) 123-4567', address: '123 Main Street, New York, NY 10001' },
    { id: 2, name: 'XYZ Business', email: 'info@xyz.com', phone: '(555) 987-6543', address: '456 Oak Avenue, Los Angeles, CA 90001' }
  ]);

  const [invoices, setInvoices] = useState([
    { id: 1, clientId: 1, number: 'INV-001', amount: 15000, date: '2025-10-01', dueDate: '2025-10-15', status: 'paid', items: [{ desc: 'Consulting Services', qty: 1, price: 15000 }] },
    { id: 2, clientId: 2, number: 'INV-002', amount: 8500, date: '2025-10-05', dueDate: '2025-10-20', status: 'pending', items: [{ desc: 'Web Development', qty: 1, price: 8500 }] },
    { id: 3, clientId: 1, number: 'INV-003', amount: 12000, date: '2025-10-10', dueDate: '2025-10-25', status: 'overdue', items: [{ desc: 'Maintenance Services', qty: 1, price: 12000 }] }
  ]);

  const [payments, setPayments] = useState([
    { id: 1, invoiceId: 1, amount: 15000, date: '2025-10-14', method: 'Wire Transfer' }
  ]);

  // Calculate statistics
  const stats = {
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0),
    overdueAmount: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
    totalClients: clients.length,
    totalInvoices: invoices.length
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setSearchResults([]);
    setShowModal(true);
  };

  const searchAddress = async (query) => {
    if (!query || query.length < 3) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectAddress = (result) => {
    setFormData({
      ...formData,
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: result.address?.city || result.address?.town || '',
      state: result.address?.state || '',
      zipCode: result.address?.postcode || ''
    });
    setSearchResults([]);
    setShowLocationSearch(false);
  };

  const useCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            setFormData({
              ...formData,
              address: data.display_name,
              latitude: latitude,
              longitude: longitude,
              city: data.address?.city || data.address?.town || '',
              state: data.address?.state || '',
              zipCode: data.address?.postcode || ''
            });
          } catch (error) {
            console.error('Reverse geocoding error:', error);
          }
        },
        (error) => {
          alert('Unable to get your location. Please enter address manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = () => {
    if (modalType === 'client') {
      setClients([...clients, { 
        ...formData, 
        id: Date.now()
      }]);
    } else if (modalType === 'invoice') {
      const newInvoice = {
        ...formData,
        id: Date.now(),
        number: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        status: 'pending',
        amount: formData.items?.reduce((sum, item) => sum + (item.qty * item.price), 0) || 0
      };
      setInvoices([...invoices, newInvoice]);
    } else if (modalType === 'payment') {
      setPayments([...payments, { ...formData, id: Date.now() }]);
      setInvoices(invoices.map(inv => 
        inv.id === parseInt(formData.invoiceId) ? { ...inv, status: 'paid' } : inv
      ));
    }
    setShowModal(false);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = getClientName(inv.clientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const StatusBadge = ({ status }) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };
    const icons = {
      paid: <Check className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      overdue: <AlertCircle className="w-3 h-3" />
    };
    const labels = {
      paid: 'Paid',
      pending: 'Pending',
      overdue: 'Overdue'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Invoice Manager</h1>
          <p className="text-blue-100 text-sm">Track invoices and payments with ease</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'payments', label: 'Payments', icon: DollarSign }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                currentView === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.pendingAmount.toLocaleString()}</p>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.overdueAmount.toLocaleString()}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
              <div className="space-y-3">
                {invoices.slice(-5).reverse().map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{inv.number}</p>
                      <p className="text-sm text-gray-600">{getClientName(inv.clientId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${inv.amount.toLocaleString()}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invoices View */}
        {currentView === 'invoices' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
              <button
                onClick={() => openModal('invoice')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Invoice
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Invoices</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{inv.number}</td>
                        <td className="px-6 py-4">{getClientName(inv.clientId)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{inv.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{inv.dueDate}</td>
                        <td className="px-6 py-4 font-semibold">${inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Clients View */}
        {currentView === 'clients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
              <button
                onClick={() => openModal('client')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Client
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map(client => (
                <div key={client.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    {client.latitude && client.longitude && (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        Located
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{client.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <span>📧</span> {client.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📱</span> {client.phone}
                    </p>
                    <p className="flex items-start gap-2">
                      <span>📍</span> 
                      <span className="flex-1">{client.address}</span>
                    </p>
                    {client.city && client.state && (
                      <p className="text-xs text-gray-500 pl-5">
                        {client.city}, {client.state} {client.zipCode}
                      </p>
                    )}
                  </div>
                  
                  {client.latitude && client.longitude && (
                    <div className="mt-4 pt-4 border-t">
                      <a
                        href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Navigation className="w-4 h-4" />
                        View on Map
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments View */}
        {currentView === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Payments Received</h2>
              <button
                onClick={() => openModal('payment')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Record Payment
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map(payment => {
                    const invoice = invoices.find(i => i.id === payment.
