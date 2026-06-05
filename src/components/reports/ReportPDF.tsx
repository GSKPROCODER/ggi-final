import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReportResponse } from '@/lib/api';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 16,
  },
  logoText: {
    fontSize: 8,
    color: '#52525b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#09090b',
  },
  date: {
    fontSize: 8,
    color: '#71717a',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#3f3f46',
    textTransform: 'uppercase',
    marginBottom: 4,
    borderBottom: '1pt solid #e4e4e7',
    paddingBottom: 2,
  },
  text: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#27272a',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    padding: 6,
    border: '1pt solid #e4e4e7',
    borderRadius: 4,
    backgroundColor: '#fafafa',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 7,
    color: '#71717a',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 12,
    fontSize: 8,
    color: '#18181b',
    fontWeight: 'bold',
  },
  listItemText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.4,
    color: '#27272a',
  },
  alertBox: {
    padding: 6,
    border: '1pt solid #fcd34d',
    backgroundColor: '#fffbeb',
    borderRadius: 4,
  },
});

export const ReportPDF = ({ report }: { report: ReportResponse }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header} wrap={false}>
        <Text style={styles.logoText}>NEXUS AI INTELLIGENCE REPORT</Text>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.date}>Generated: {format(new Date(report.created_at), 'PPP')}</Text>
      </View>

      {report.overview && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.text}>{report.overview}</Text>
        </View>
      )}

      {report.metrics && report.metrics.length > 0 && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            {report.metrics.map((m, i) => (
              <View key={i} style={styles.metricCard}>
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {report.key_findings && report.key_findings.length > 0 && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Key Findings</Text>
          {report.key_findings.map((f, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.listItemText}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {report.trend_analysis && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Trend Analysis</Text>
          <Text style={styles.text}>{report.trend_analysis}</Text>
        </View>
      )}

      {report.risk_assessment && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <View style={styles.alertBox}>
            <Text style={styles.text}>{report.risk_assessment}</Text>
          </View>
        </View>
      )}

      {report.recommendations && report.recommendations.length > 0 && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {report.recommendations.map((r, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.listItemText}>{r}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);
