import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Loading } from '@/components';
import { buildApiUrl } from '@/config/api';

interface Case {
  case_id: string;
  title: string;
  description: string;
}

export const CaseSelection: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/cases'));
        if (!response.ok) throw new Error('Failed to fetch cases');
        const data = await response.json();
        // API returns { success: true, count: number, cases: [...] }
        setCases(data.cases || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const handleCaseSelect = (caseId: string) => {
    navigate(`/session/${caseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loading size="lg" text="Loading cases..." fullScreen />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-gold-500 hover:text-gold-400"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gold-500 hover:text-gold-400 mb-4"
          >
            ← Back to Main Menu
          </button>
          <h1 className="text-4xl font-bold text-gold-500 mb-2">Select a Case</h1>
          <p className="text-gray-400">Choose a mystery to solve</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((caseItem) => (
            <Card
              key={caseItem.case_id}
              onClick={() => handleCaseSelect(caseItem.case_id)}
              hover
            >
              <h3 className="text-xl font-semibold text-gold-500 mb-2">
                {caseItem.title}
              </h3>
              <p className="text-gray-400">{caseItem.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
