import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import {
  BarChart3,
  Users,
  Shield,
  Clock,
  Award,
  Calendar,
  FileText,
  Activity
} from 'lucide-react';

export const AdminPortalView: React.FC = () => {
  const { language, t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/api/admin/stats');
      setData(res);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-[#703616]">
        <div className="w-8 h-8 border-3 border-[#8a431c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">
          {language === 'ta' ? 'தரவுத்தள அளவீடுகளை ஒருங்கிணைக்கிறது...' : 'Aggregating database system metrics...'}
        </p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const auditLogs = Array.isArray(data?.auditLogs) ? data.auditLogs : [];
  const users = Array.isArray(data?.users) ? data.users : [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header */}
      <div className="pb-6 border-b border-[#ebe0ce]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
          {language === 'ta' ? 'கணினி செயல்பாடுகள் & மேலாண்மை' : 'System Operations'}
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
          {language === 'ta' ? 'நிர்வாக மையம் & தரவுத்தள அளவீடுகள்' : 'Admin Portal & Database Metrics'}
        </h1>
        <p className="text-sm text-[#703616] mt-1">
          {language === 'ta'
            ? 'உண்மையான தரவுத்தளத்திலிருந்து பெறப்பட்ட நேரலை அளவீடுகள் மற்றும் தணிக்கைக் குறிப்புகள்.'
            : 'Real-time aggregated telemetry directly from the persistent relational database. No mock numbers.'}
        </p>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0c263d] mb-2">
            <Users className="w-5 h-5 text-[#8a431c]" />
            <span className="text-[10px] font-bold uppercase text-[#703616]">
              {language === 'ta' ? 'பதிவானவர்கள்' : 'Registered'}
            </span>
          </div>
          <div className="font-heading text-3xl font-black text-[#0c263d]">{metrics.totalUsers ?? 0}</div>
          <p className="text-xs text-[#703616] mt-1">
            {language === 'ta' ? 'மொத்த பயனர் கணக்குகள்' : 'Total User Accounts'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0c263d] mb-2">
            <Calendar className="w-5 h-5 text-[#0d9488]" />
            <span className="text-[10px] font-bold uppercase text-[#703616]">
              {language === 'ta' ? 'நிறைவுற்றவை' : 'Completed'}
            </span>
          </div>
          <div className="font-heading text-3xl font-black text-[#0c263d]">{metrics.completedSessions ?? 0}</div>
          <p className="text-xs text-[#703616] mt-1">
            {language === 'ta' ? 'சரிபார்க்கப்பட்ட அமர்வுகள்' : 'Verified Sessions'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0c263d] mb-2">
            <Award className="w-5 h-5 text-[#c4682e]" />
            <span className="text-[10px] font-bold uppercase text-[#703616]">
              {language === 'ta' ? 'சான்றிதழ்கள்' : 'Certificates'}
            </span>
          </div>
          <div className="font-heading text-3xl font-black text-[#0c263d]">{metrics.totalCertificates ?? 0}</div>
          <p className="text-xs text-[#703616] mt-1">
            {language === 'ta' ? 'வழங்கப்பட்ட சான்றுகள்' : 'Issued Credentials'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0c263d] mb-2">
            <Clock className="w-5 h-5 text-[#8a431c]" />
            <span className="text-[10px] font-bold uppercase text-[#703616]">
              {language === 'ta' ? 'பொருளாதாரம்' : 'Economy'}
            </span>
          </div>
          <div className="font-heading text-3xl font-black text-[#0c263d]">{metrics.creditsCirculation ?? 0}</div>
          <p className="text-xs text-[#703616] mt-1">
            {language === 'ta' ? 'சுழற்சியில் உள்ள நேரக் கடன்கள்' : 'Credits in Circulation'}
          </p>
        </div>
      </div>

      {/* User Directory */}
      <div className="p-6 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0c263d] flex items-center space-x-2">
          <Users className="w-5 h-5 text-[#8a431c]" />
          <span>
            {language === 'ta' ? 'பயனர் பட்டியல்' : 'User Directory'} ({users.length})
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6efe3] text-[#703616] uppercase font-bold text-[10px] tracking-wider border-b border-[#ebe0ce]">
              <tr>
                <th className="py-2.5 px-4">{language === 'ta' ? 'பயனர் ID' : 'User ID'}</th>
                <th className="py-2.5 px-4">{language === 'ta' ? 'பெயர்' : 'Name'}</th>
                <th className="py-2.5 px-4">{language === 'ta' ? 'மின்னஞ்சல்' : 'Email'}</th>
                <th className="py-2.5 px-4">{language === 'ta' ? 'பங்கு' : 'Role'}</th>
                <th className="py-2.5 px-4">{language === 'ta' ? 'செயலில் உள்ள முறைமை' : 'Active Mode'}</th>
                <th className="py-2.5 px-4">{language === 'ta' ? 'உருவாக்கப்பட்டது' : 'Created'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe0ce]">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-[#fcfaf6]">
                  <td className="py-2.5 px-4 font-mono text-[10px] text-[#703616]">{u.id}</td>
                  <td className="py-2.5 px-4 font-bold text-[#0c263d]">{u.full_name}</td>
                  <td className="py-2.5 px-4 text-[#703616]">{u.email}</td>
                  <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-[#8a431c]">{u.role}</td>
                  <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-[#c4682e]">{u.active_mode}</td>
                  <td className="py-2.5 px-4 text-[10px] text-[#703616]">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="p-6 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0c263d] flex items-center space-x-2">
          <Activity className="w-5 h-5 text-[#8a431c]" />
          <span>
            {language === 'ta' ? 'கணினி தணிக்கைப் பதிவுகள்' : 'System Audit Log Stream'}
          </span>
        </h2>
        <div className="divide-y divide-[#ebe0ce] max-h-96 overflow-y-auto">
          {auditLogs.map((log: any) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-[#0c263d]">{log.action}</span>
                <span className="text-[#703616] ml-2">by {log.user_name || log.user_id || 'System'}</span>
                <p className="text-[11px] text-[#703616]/80 mt-0.5">{log.details}</p>
              </div>
              <span className="text-[10px] text-[#703616] font-mono">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
