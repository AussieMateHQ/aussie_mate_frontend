import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, handleAPIError } from '../../services/api';
import { PageHeader, Loader, Button } from '../../components';
import { ChevronDown, ChevronRight, Plus, Check } from 'lucide-react';

// Admin-only screen for the one thing that previously had no UI at all:
// setting how many lead credits a cleaner is charged to unlock a job of a
// given service type. The backend (ServiceType.leadCreditCost +
// leadCreditService's fallback chain) has supported this for a while -
// this page is just the first place an admin can actually set it without
// calling the API directly.
//
// Kept deliberately narrow: list categories, expand to their service
// types, edit each one's credit cost / active flag, add a new service
// type under a category. No category edit/delete here yet - this is
// scoped to the pricing gap, not a full admin console.
const AdminCategoryPricingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [serviceTypesByCategory, setServiceTypesByCategory] = useState({});
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [drafts, setDrafts] = useState({}); // serviceTypeId -> { leadCreditCost, isActive }
  const [newServiceType, setNewServiceType] = useState({}); // categoryId -> { name, leadCreditCost }

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (categoryId) => {
    if (expandedId === categoryId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(categoryId);
    if (!serviceTypesByCategory[categoryId]) {
      try {
        setLoadingServiceTypes(true);
        const response = await adminAPI.getServiceTypes(categoryId);
        const list = response.data || [];
        setServiceTypesByCategory((prev) => ({ ...prev, [categoryId]: list }));
        setDrafts((prev) => {
          const next = { ...prev };
          list.forEach((st) => {
            next[st._id] = {
              leadCreditCost: st.leadCreditCost ?? '',
              isActive: st.isActive !== false,
            };
          });
          return next;
        });
      } catch (err) {
        setError(handleAPIError(err));
      } finally {
        setLoadingServiceTypes(false);
      }
    }
  };

  const updateDraft = (serviceTypeId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [serviceTypeId]: { ...prev[serviceTypeId], [field]: value },
    }));
  };

  const saveServiceType = async (categoryId, serviceType) => {
    const draft = drafts[serviceType._id] || {};
    try {
      setSavingId(serviceType._id);
      setError('');
      const response = await adminAPI.updateServiceType(serviceType._id, {
        leadCreditCost:
          draft.leadCreditCost === '' || draft.leadCreditCost === null
            ? ''
            : Number(draft.leadCreditCost),
        isActive: draft.isActive,
      });
      setServiceTypesByCategory((prev) => ({
        ...prev,
        [categoryId]: prev[categoryId].map((st) =>
          st._id === serviceType._id ? response.data : st
        ),
      }));
      setSavedId(serviceType._id);
      setTimeout(() => setSavedId((id) => (id === serviceType._id ? null : id)), 1500);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setSavingId(null);
    }
  };

  const addServiceType = async (categoryId) => {
    const draft = newServiceType[categoryId];
    if (!draft || !draft.name || !draft.name.trim()) {
      setError('Enter a name for the new service type');
      return;
    }
    try {
      setSavingId(`new-${categoryId}`);
      setError('');
      const response = await adminAPI.createServiceType({
        categoryId,
        name: draft.name.trim(),
        isActive: true,
        leadCreditCost:
          draft.leadCreditCost === undefined || draft.leadCreditCost === ''
            ? ''
            : Number(draft.leadCreditCost),
      });
      setServiceTypesByCategory((prev) => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), response.data],
      }));
      setDrafts((prev) => ({
        ...prev,
        [response.data._id]: {
          leadCreditCost: response.data.leadCreditCost ?? '',
          isActive: response.data.isActive !== false,
        },
      }));
      setNewServiceType((prev) => ({ ...prev, [categoryId]: { name: '', leadCreditCost: '' } }));
      setCategories((prev) =>
        prev.map((c) => (c._id === categoryId ? { ...c, serviceCount: (c.serviceCount || 0) + 1 } : c))
      );
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <Loader fullscreen message="Loading categories..." />;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="Category & Lead-Credit Pricing"
          subtitle="Set how many credits a cleaner spends to unlock a job"
          onBack={() => navigate(-1)}
        />

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          Leave a service type's cost blank to fall back to the cleaner's subscription
          plan rate (the default is 20 credits if no plan rate applies either).
        </p>

        <div className="mt-4 space-y-3">
          {categories.map((category) => {
            const isOpen = expandedId === category._id;
            const serviceTypes = serviceTypesByCategory[category._id] || [];
            const draftNew = newServiceType[category._id] || { name: '', leadCreditCost: '' };

            return (
              <div key={category._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category._id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <span className="font-medium text-gray-900">{category.name}</span>
                    {category.isActive === false && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {category.serviceCount ?? 0} service type{category.serviceCount === 1 ? '' : 's'}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50/60">
                    {loadingServiceTypes && serviceTypes.length === 0 ? (
                      <div className="text-sm text-gray-400 py-2">Loading service types...</div>
                    ) : (
                      serviceTypes.map((st) => {
                        const draft = drafts[st._id] || { leadCreditCost: '', isActive: true };
                        return (
                          <div
                            key={st._id}
                            className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2.5"
                          >
                            <span className="text-sm font-medium text-gray-800 min-w-[140px]">
                              {st.name}
                            </span>

                            <label className="flex items-center gap-1.5 text-xs text-gray-500">
                              Credits
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="plan rate"
                                value={draft.leadCreditCost}
                                onChange={(e) =>
                                  updateDraft(st._id, 'leadCreditCost', e.target.value)
                                }
                                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
                              />
                            </label>

                            <label className="flex items-center gap-1.5 text-xs text-gray-500">
                              <input
                                type="checkbox"
                                checked={draft.isActive}
                                onChange={(e) => updateDraft(st._id, 'isActive', e.target.checked)}
                              />
                              Active
                            </label>

                            <div className="ml-auto">
                              <Button
                                size="sm"
                                variant={savedId === st._id ? 'success' : 'secondary'}
                                loading={savingId === st._id}
                                onClick={() => saveServiceType(category._id, st)}
                              >
                                {savedId === st._id ? (
                                  <>
                                    <Check className="w-4 h-4" /> Saved
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {!loadingServiceTypes && serviceTypes.length === 0 && (
                      <div className="text-sm text-gray-400">No service types yet.</div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="New service type name"
                        value={draftNew.name}
                        onChange={(e) =>
                          setNewServiceType((prev) => ({
                            ...prev,
                            [category._id]: { ...draftNew, name: e.target.value },
                          }))
                        }
                        className="flex-1 min-w-[160px] border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="credits (optional)"
                        value={draftNew.leadCreditCost}
                        onChange={(e) =>
                          setNewServiceType((prev) => ({
                            ...prev,
                            [category._id]: { ...draftNew, leadCreditCost: e.target.value },
                          }))
                        }
                        className="w-32 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Plus className="w-4 h-4" />}
                        loading={savingId === `new-${category._id}`}
                        onClick={() => addServiceType(category._id)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="text-center text-gray-400 py-12">No categories found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryPricingPage;
