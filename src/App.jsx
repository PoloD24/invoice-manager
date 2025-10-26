import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Clock,
  AlertCircle,
  MapPin,
  Navigation,
} from 'lucide-react';

// --- Mapa con React-Leaflet ---
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Hook personalizado para detectar clics en el mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Componente reutilizable del mapa
const MapComponent = ({ center, selectedLocation, onMapClick }) => {
  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
      )}
      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
};

// --- Componente principal ---
const InvoiceManagerApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Datos
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'ABC Company',
      email: 'contact@abc.com',
      phone: '(555) 123-4567',
      address: '123 Main Street, New York, NY 10001',
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: 2,
      name: 'XYZ Business',
      email: 'info@xyz.com',
      phone: '(555) 987-6543',
      address: '456 Oak Avenue, Los Angeles, CA 90001',
      latitude: 34.0522,
      longitude: -118.2437,
    },
  ]);

  const [invoices, setInvoices] = useState([
    {
      id: 1,
      clientId: 1,
      number: 'INV-001',
      amount: 15000,
      date: '2025-10-01',
      dueDate: '2025-10-15',
      status: 'paid',
      items: [{ desc: 'Consulting Services', qty: 1, price: 15000 }],
    },
    {
      id: 2,
      clientId: 2,
      number: 'INV-002',
      amount: 8500,
      date: '2025-10-05',
      dueDate: '2025-10-20',
      status: 'pending',
      items: [{ desc: 'Web Development', qty: 1, price: 8500 }],
    },
    {
      id: 3,
      clientId: 1,
      number: 'INV-003',
      amount: 12000,
      date: '2025-10-10',
      dueDate: '2025-10-25',
      status: 'overdue',
      items: [{ desc: 'Maintenance Services', qty: 1, price: 12000 }],
    },
  ]);

  const [payments, setPayments] = useState([
    { id: 1, invoiceId: 1, amount: 15000, date: '2025-10-14', method: 'Wire Transfer' },
  ]);

  const [formData, setFormData] = useState({});
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]); // Los Angeles
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Estadísticas
  const stats = {
    totalRevenue: invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: invoices
      .filter((i) => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0),
    overdueAmount: invoices
      .filter((i) => i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0),
    totalClients: clients.length,
    totalInvoices: invoices.length,
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setSelectedLocation(null);
    setShowModal(true);
  };

  const openMapPicker = () => {
    // Si ya hay una ubicación guardada, centrar el mapa ahí
    if (formData.latitude && formData.longitude) {
      setMapCenter([formData.latitude, formData.longitude]);
      setSelectedLocation({ lat: formData.latitude, lng: formData.longitude });
    }
    setShowMapModal(true);
  };

  const handleMapClick = (lat, lng) => {
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    setMapCenter([lat, lng]);

    // Reverse geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        const address = data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        setFormData((prev) => ({
          ...prev,
          address,
          latitude: lat,
          longitude: lng,
        }));
      })
      .catch((err) => console.error('Geocoding error:', err));
  };

  const searchLocation = (query) => {
    if (!query.trim()) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);
          setMapCenter([newLat, newLng]);
          handleMapClick(newLat, newLng);
        }
      })
      .catch((err) => console.error('Search error:', err));
  };

  const handleSubmit = () => {
    if (modalType === 'client') {
      const newClient = {
        ...formData,
        id: Date.now(),
        latitude: selectedLocation?.lat || formData.latitude || null,
        longitude: selectedLocation?.lng || formData.longitude || null,
      };
      setClients([...clients, newClient]);
    } else if (modalType === 'invoice') {
      const amount = formData.items
        ? formData.items.reduce((sum, item) => sum + item.qty * item.price, 0)
        : formData.amount || 0;

      const newInvoice = {
        id: Date.now(),
        number: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        clientId: parseInt(formData.clientId),
        date: formData.date,
        dueDate: formData.dueDate,
        amount,
        status: 'pending',
        items: formData.items || [{ desc: formData.description, qty: 1, price: amount }],
      };
      setInvoices([...invoices, newInvoice]);
    } else if (modalType === 'payment') {
      const newPayment = {
        id: Date.now(),
        invoiceId: parseInt(formData.invoiceId),
        amount: parseFloat(formData.amount),
        date: formData.date,
        method: formData.method,
      };
      setPayments([...payments, newPayment]);
      setInvoices(
        invoices.map((inv) =>
          inv.id === parseInt(formData.invoiceId) ? { ...inv, status: 'paid' } : inv
        )
      );
    }
    setShowModal(false);
    setSelectedLocation(null);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      getClientName(inv.clientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const StatusBadge = ({ status }) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    const icons = {
      paid: <Check className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      overdue: <AlertCircle className="w-3 h-3" />,
    };
    const labels = {
      paid: 'Paid',
      pending: 'Pending',
      overdue: 'Overdue',
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
            { id: 'payments', label: 'Payments', icon: DollarSign },
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
                {invoices.slice(-5).reverse().map((inv) => (
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
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{inv.number}</td>
                        <td className="px-6 py-4">{getClientName(inv.clientId)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{inv.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{inv.dueDate}</td>
                        <td className="px-6 py-4 font-semibold">${inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={inv.status} />
                        </td>
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
              {clients.map((client) => (
                <div key={client.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    {client.latitude && client.longitude && (
                      <span className="text-green-600 text-xs font-medium">📍 Located</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{client.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📧 {client.email}</p>
                    <p>📱 {client.phone}</p>
                    <p>📍 {client.address}</p>
                    {client.latitude && client.longitude && (
                      <p className="text-xs text-gray-400 mt-2">
                        Coordinates: {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
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
                  {payments.map((payment) => {
                    const invoice = invoices.find((i) => i.id === payment.invoiceId);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{invoice?.number}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">${payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{payment.date}</td>
                        <td className="px-6 py-4">{payment.method}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Select Client Location</h3>
              <button onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search address in USA..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchLocation(e.target.value);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    searchLocation(input.value);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click on the map to select a location or search for an address
              </p>
            </div>

            <div className="flex-1 relative" style={{ minHeight: '400px' }}>
              <MapComponent
                center={mapCenter}
                selectedLocation={selectedLocation}
                onMapClick={handleMapClick}
              />
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowMapModal(false);
                }}
                disabled={!selectedLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {modalType === 'client' && 'New Client'}
                {modalType === 'invoice' && 'New Invoice'}
                {modalType === 'payment' && 'Record Payment'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalType === 'client' && (
                <>
                  <input
                    placeholder="Client name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <input
                    placeholder="Phone"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <div className="flex gap-2">
                      <input
                        placeholder="Address (auto-filled from map)"
                        value={formData.address || ''}
                        readOnly
                        className="flex-1 px-4 py-2 border rounded-lg bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={openMapPicker}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        📍 Pick on Map
                      </button>
                    </div>
                    {selectedLocation && (
                      <p className="text-xs text-green-600">
                        ✓ Location selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </>
              )}

              {modalType === 'invoice' && (
                <>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                  <input
                    placeholder="Service description"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  />
                </>
              )}

              {modalType === 'payment' && (
                <>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.invoiceId || ''}
                    onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                  >
                    <option value="">Select invoice</option>
                    {invoices
                      .filter((i) => i.status !== 'paid')
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.number} - ${inv.amount.toLocaleString()}
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount paid"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  />
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.method || ''}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  >
                    <option value="">Payment method</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Check">Check</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Venmo">Venmo</option>
                    <option value="Zelle">Zelle</option>
                  </select>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagerApp;
