#!/usr/bin/env bash
# Galaxy ARM Provisioning — retries every 5 minutes until capacity opens.
set -euo pipefail
export OCI_CLI_SUPPRESS_FILE_PERMISSIONS_WARNING=True
export SUPPRESS_LABEL_WARNING=True

TENANCY="ocid1.tenancy.oc1..aaaaaaaaydi2atrbb72iqu5ewbjllwviok7mgghexei6a34mhubf3bdvdzbq"
SUBNET_ID="ocid1.subnet.oc1.us-chicago-1.aaaaaaaagajlnjzpwlduzp6gpcitg366bd2rrdobunva3oajobaeo3ezay6a"
IMAGE_ID="ocid1.image.oc1.us-chicago-1.aaaaaaaaqzxgc5f4hbxsoi4mhogsodroy5wgnvxcpuwpt77gt4wl3a3x6m2q"
SSH_KEY="$HOME/.ssh/galaxy-oracle.pub"
ADs=("sZaG:US-CHICAGO-1-AD-1" "sZaG:US-CHICAGO-1-AD-2" "sZaG:US-CHICAGO-1-AD-3")
INTERVAL=300
LOG="/tmp/galaxy-provision.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

log "Galaxy ARM Provisioning — us-chicago-1, retry every ${INTERVAL}s"

attempt=0
while true; do
  attempt=$((attempt + 1))
  for AD in "${ADs[@]}"; do
    log "#${attempt} ${AD}"
    result=$(oci compute instance launch \
      --compartment-id "$TENANCY" \
      --display-name "galaxy-oracle" \
      --availability-domain "$AD" \
      --shape "VM.Standard.A1.Flex" \
      --shape-config '{"ocpus": 4, "memoryInGBs": 24}' \
      --image-id "$IMAGE_ID" \
      --subnet-id "$SUBNET_ID" \
      --ssh-authorized-keys-file "$SSH_KEY" \
      --assign-public-ip true \
      --boot-volume-size-in-gbs 200 \
      --query 'data.{id:id, ip:"public-ip"}' 2>&1) || true

    if echo "$result" | grep -q '"id"'; then
      pub_ip=$(echo "$result" | grep -o '"ip": "[^"]*"' | cut -d'"' -f4)
      inst_id=$(echo "$result" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
      log "INSTANCE CREATED: ${inst_id} at ${pub_ip}"
      echo "PUBLIC_IP=${pub_ip}" > /tmp/galaxy-instance.env
      echo "INSTANCE_ID=${inst_id}" >> /tmp/galaxy-instance.env
      exit 0
    fi
    log "  → no capacity"
    sleep 2
  done
  log "Waiting ${INTERVAL}s..."
  sleep "$INTERVAL"
done
