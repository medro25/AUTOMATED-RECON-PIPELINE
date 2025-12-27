FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    git \
    libpcap-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for tools installation
WORKDIR /tmp

# ========== INSTALL SUBFINDER ==========
RUN wget -q https://github.com/projectdiscovery/subfinder/releases/download/v2.6.6/subfinder_2.6.6_linux_amd64.zip -O subfinder.zip \
    && unzip -q subfinder.zip \
    && mv subfinder /usr/local/bin/ \
    && chmod +x /usr/local/bin/subfinder \
    && rm -f subfinder.zip LICENSE.md README.md \
    && subfinder -version

# ========== INSTALL HTTPX ==========
RUN wget -q https://github.com/projectdiscovery/httpx/releases/download/v1.6.8/httpx_1.6.8_linux_amd64.zip -O httpx.zip \
    && unzip -q httpx.zip \
    && mv httpx /usr/local/bin/ \
    && chmod +x /usr/local/bin/httpx \
    && rm -f httpx.zip LICENSE.md README.md \
    && httpx -version

# ========== INSTALL NAABU ==========
RUN wget -q https://github.com/projectdiscovery/naabu/releases/download/v2.3.2/naabu_2.3.2_linux_amd64.zip -O naabu.zip \
    && unzip -q naabu.zip \
    && mv naabu /usr/local/bin/ \
    && chmod +x /usr/local/bin/naabu \
    && rm -f naabu.zip LICENSE.md README.md \
    && naabu -version

# ========== INSTALL NUCLEI ==========
RUN wget -q https://github.com/projectdiscovery/nuclei/releases/download/v3.3.7/nuclei_3.3.7_linux_amd64.zip -O nuclei.zip \
    && unzip -q nuclei.zip \
    && mv nuclei /usr/local/bin/ \
    && chmod +x /usr/local/bin/nuclei \
    && rm -f nuclei.zip LICENSE.md README.md \
    && nuclei -version

# ⭐ CRITICAL FIX: Create config directory and force template installation
RUN mkdir -p /root/.config/nuclei \
    && echo "Installing Nuclei templates (this may take 2-3 minutes)..." \
    && nuclei -update-templates -silent \
    && echo "Verifying template installation..." \
    && TEMPLATE_COUNT=$(ls /root/.config/nuclei-templates/ 2>/dev/null | wc -l || echo 0) \
    && echo "Template directory count: $TEMPLATE_COUNT" \
    && if [ "$TEMPLATE_COUNT" -lt 10 ]; then \
         echo "ERROR: Templates not installed, retrying..."; \
         rm -rf /root/.config/nuclei-templates; \
         git clone --depth 1 https://github.com/projectdiscovery/nuclei-templates.git /root/.config/nuclei-templates; \
       fi \
    && echo "Final verification..." \
    && ls -lh /root/.config/nuclei-templates/ \
    && FINAL_COUNT=$(find /root/.config/nuclei-templates/ -name "*.yaml" 2>/dev/null | wc -l || echo 0) \
    && echo "Total YAML templates found: $FINAL_COUNT" \
    && if [ "$FINAL_COUNT" -lt 100 ]; then \
         echo "FATAL: Not enough templates installed ($FINAL_COUNT found, need 100+)"; \
         exit 1; \
       fi \
    && echo "✓ Templates successfully installed!"

# Verify all tools are installed
RUN echo "=== Verifying installations ===" \
    && subfinder -version \
    && httpx -version \
    && naabu -version \
    && nuclei -version \
    && echo "=== Testing nuclei templates ===" \
    && nuclei -tl 2>/dev/null | head -20 \
    && echo "=== All tools installed successfully ==="

# Set up application directory
WORKDIR /app

# Copy package files
COPY package.json .

# Install Node.js dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "app.js"]