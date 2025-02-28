from prowler.lib.check.models import Check, Check_Report_GCP
from prowler.providers.gcp.services.cloudsql.cloudsql_client import cloudsql_client


class cloudsql_instance_ssl_connections(Check):
    def execute(self) -> Check_Report_GCP:
        findings = []
        for instance in cloudsql_client.instances:
            report = Check_Report_GCP(metadata=self.metadata(), resource=instance)
            report.status = "PASS"
            report.status_extended = (
                f"Database Instance {instance.name} requires SSL connections."
            )
            if (
                not instance.require_ssl
                or instance.ssl_mode == "ALLOW_UNENCRYPTED_AND_ENCRYPTED"
            ):
                report.status = "FAIL"
                report.status_extended = f"Database Instance {instance.name} does not require SSL connections."
            findings.append(report)

        return findings
