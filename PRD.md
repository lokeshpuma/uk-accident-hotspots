PRD.md

Road Accident Hotspot Detection & Intelligent Road Safety Analytics

Project Name: HotspotWatch
Project Type: Intelligent Road Safety Analytics Platform
Primary Goal: Transform the existing project into a secure, lightweight, reliable, intelligent, and fully functional road accident hotspot detection website.
Primary Constraint: Prefer free, open-source, and locally executable technologies. Do not require paid APIs, subscriptions, paid hosting, or API keys for core functionality.
Implementation Agent: Antigravity
Development Approach: Audit → Plan → Implement → Test → Secure → Deploy → Document.

⸻

1. INSTRUCTIONS TO THE IMPLEMENTATION AGENT

You must work directly with the existing repository.

Do not merely generate recommendations, documentation, mockups, or sample code. Implement the required changes in the actual project files.

Your responsibility is to deliver a working application, not just an attractive dashboard.

1.1 Mandatory Initial Actions

Before changing the project:

1. Inspect the entire repository.
2. Read README.md, existing PRDs, configuration files, source code, Dockerfiles, Docker Compose files, dependency manifests, and deployment configuration.
3. Identify the actual frontend framework, backend framework, data pipeline, APIs, and deployment target.
4. Map the relationship between every important directory and component.
5. Identify existing features that work, features that are incomplete, duplicated implementations, dead code, fake functionality, and security vulnerabilities.
6. Run the existing application and tests if the environment permits.
7. Record the current build status and test failures.
8. Create an implementation plan based on verified findings.

Do not assume that a feature is functional merely because its name, user interface, or documentation exists.

For every important feature, verify that the interface invokes real logic, the logic processes actual data, and the resulting output is correct.

1.2 Repository Preservation Rules

* Preserve the existing project identity and useful source code.
* Preserve working React components, API endpoints, Hadoop jobs, Kafka ingestion, and data-processing logic when they provide real value.
* Do not rewrite the entire project unnecessarily.
* Prefer small, maintainable changes over a complete rewrite.
* Do not delete files simply because they are large or unfamiliar.
* Before deleting a component, establish that it is unused, duplicated, unsafe, obsolete, or outside the agreed product scope.
* Remove references to deleted components from imports, configuration, documentation, Docker Compose, scripts, and build files.
* Keep Git history intact.
* Never delete the user’s original datasets or important project files without verifying that they are unnecessary.
* Do not replace real calculations with hard-coded results to make the website appear functional.
* Do not claim that a task is complete unless its implementation has been verified.

1.3 Definition of Done

The project is complete only when:

* The website builds successfully.
* The main user workflows function.
* Data processing uses real input rather than fabricated outputs.
* Important calculations have automated tests.
* Security issues have been fixed or explicitly documented with justified exceptions.
* Empty states, loading states, errors, and invalid inputs are handled.
* The website can run without paid services.
* Deployment instructions are accurate.
* Existing useful big-data components remain available when appropriate.
* The README and PRD match the implemented system.
* No critical or high-severity unresolved security findings remain without a documented mitigation plan.

⸻

2. PRODUCT VISION

Build a general-purpose road accident analytics platform that helps users understand where collisions occur, how their frequency and severity vary, and which locations may deserve further safety investigation.

The application must support both:

1. Simple analysis: A user uploads a collision dataset and immediately obtains meaningful hotspot analytics.
2. Advanced processing: A developer or researcher uses the existing Kafka and Hadoop pipeline to process larger datasets.

The platform should be useful for:

* Students and researchers.
* Road safety analysts.
* Traffic planning teams.
* Data scientists.
* Municipal authorities.
* Transport departments.
* Academic project demonstrations.

The application must not assume that every user has a distributed computing environment.

A person who only wants to analyse a CSV file should not need to configure Hadoop, Kafka, Docker, Redis, or a paid cloud service.

⸻

3. PRODUCT PRINCIPLES

The application must follow these principles.

3.1 Data Integrity

All statistics must be calculated from actual records.

Never fabricate:

* Accident records.
* Weather observations.
* Road names.
* Traffic conditions.
* Live events.
* Forecast results.
* Model confidence.
* Infrastructure attributes.
* Pipeline health.
* API response values.

Synthetic data may be provided for demonstrations, but it must be explicitly labelled as synthetic.

3.2 Honest Intelligence

Distinguish between:

* Observed historical statistics.
* Statistical estimates.
* Heuristic risk scores.
* Machine learning predictions.
* External live information.

A heuristic score must never be presented as a calibrated accident probability.

A forecast must never be presented as an established prediction model unless it has been trained or otherwise specified appropriately, evaluated on held-out historical data, and documented.

3.3 Minimal Complexity

Prefer the simplest architecture that reliably implements the required features.

Avoid unnecessary services, libraries, background processes, duplicated business logic, and configuration.

3.4 Privacy

Uploaded datasets should be processed locally in the browser by default.

Do not transmit user-uploaded files to external services unless a clearly explained feature explicitly requires it and the user consents.

3.5 Accessibility

The website must be usable on desktop computers, tablets, and mobile devices.

⸻

4. EXISTING PROJECT AUDIT

Audit the existing project before implementing the target architecture.

The existing project includes components associated with:

* React.
* Leaflet.
* Python.
* FastAPI.
* Kafka.
* Hadoop HDFS.
* Hadoop MapReduce.
* Docker Compose.
* Historical accident datasets.
* Heatmap generation.
* Risk forecasting.
* Economic impact calculations.
* Patrol planning.

Verify which components are actually present and functional before changing them.

4.1 Audit Categories

A. Frontend

Inspect:

* Dashboard pages.
* Routing.
* Components.
* State management.
* API integration.
* Charts.
* Map rendering.
* Filters.
* Forms.
* Data tables.
* Exports.
* Error handling.
* Responsive design.
* Accessibility.
* Dependency usage.

Identify duplicate components, unused dependencies, inaccessible controls, fake buttons, hard-coded results, and broken navigation.

B. Backend

Inspect:

* API endpoints.
* Request validation.
* Response schemas.
* Authentication and authorization, if applicable.
* CORS configuration.
* File handling.
* External HTTP requests.
* Webhook endpoints.
* Error handling.
* Logging.
* Configuration.
* Secret management.
* Dependency versions.

C. Data Processing

Inspect:

* CSV ingestion.
* Data cleaning.
* Duplicate handling.
* Date parsing.
* Coordinate validation.
* Severity mapping.
* Geographic aggregation.
* Time-band classification.
* Recency weighting.
* Forecasting.
* Report generation.
* Data freshness.

D. Infrastructure

Inspect:

* Dockerfiles.
* Docker Compose services.
* Kafka topics.
* Kafka consumers and producers.
* HDFS directories.
* MapReduce jobs.
* Health checks.
* Startup dependencies.
* Persistent volumes.
* Port exposure.
* Resource usage.

E. Security

Inspect:

* CORS.
* Server-side request forgery.
* Unsafe evaluation.
* Command injection.
* Path traversal.
* Cross-site scripting.
* File upload handling.
* Dependency vulnerabilities.
* Hard-coded secrets.
* Public administrative interfaces.
* Unauthenticated sensitive endpoints.
* Unsafe HTTP requests.
* Excessive permissions.
* Information disclosure.

4.2 Audit Deliverables

Create:

* AUDIT_REPORT.md
* SECURITY_AUDIT.md
* IMPLEMENTATION_PLAN.md
* Updated PRD.md

Each finding must include:

* File and location.
* Description.
* Severity.
* Impact.
* Recommended fix.
* Implementation status.
* Verification method.

Do not describe a suspected vulnerability as confirmed unless the evidence supports that conclusion.

⸻

5. FEATURES TO KEEP

Retain the following essential features.

5.1 Dashboard

The main dashboard must display:

* Total valid collision records.
* Number of unique collision records when identifiers permit deduplication.
* Number of geographic cells containing collisions.
* Number of identified hotspots.
* Fatal, serious, and slight collision counts when the source provides compatible severity data.
* Selected date range.
* Dataset source.
* Dataset freshness.
* Data validation summary.

Every displayed metric must be derived from the active dataset and filters.

Clicking a metric should navigate to relevant records or apply an appropriate filter when practical.

Do not display fabricated live counters.

5.2 Dataset Upload

Allow users to upload CSV files from their devices.

Requirements:

* Accept CSV files.
* Validate file size before parsing.
* Set a configurable maximum upload size.
* Support UTF-8 and UTF-8 BOM.
* Handle quoted fields and embedded delimiters correctly.
* Handle missing columns.
* Handle empty files.
* Detect invalid numeric values.
* Detect invalid coordinates.
* Handle malformed rows without crashing.
* Report the number of accepted and rejected records.
* Explain common validation failures.
* Provide a preview before committing a new dataset.
* Provide a way to cancel or replace an upload.

Do not upload files to a remote server in the default browser-only workflow.

Use streaming or chunked processing where appropriate to avoid freezing the browser.

5.3 Data Schema Mapping

Support common variations in accident dataset column names.

Examples:

Standard field	Possible source columns
Accident identifier	collision_index, accident_id, id
Date	date, accident_date, collision_date
Time	time, accident_time
Latitude	latitude, lat
Longitude	longitude, lon, lng
Severity	collision_severity, accident_severity, severity
Casualties	number_of_casualties, casualties
Vehicles	number_of_vehicles, vehicles

These are examples, not an exhaustive list.

The application must let users map columns manually when automatic detection is ambiguous.

Do not silently interpret an unrelated column as severity, date, or coordinates.

When essential fields are unavailable, explain which analyses cannot be performed.

5.4 Data Validation

Validate:

* Required fields.
* Date formats.
* Time formats.
* Latitude and longitude ranges.
* Numeric values.
* Severity categories.
* Duplicate identifiers.
* Missing coordinates.
* Invalid timestamps.
* Negative counts.
* Inconsistent records.

For the existing Great Britain STATS19 dataset, validate against its documented schema and expected geographic bounds.

For general-purpose datasets, do not apply Great Britain geographic restrictions unless the user selects that dataset profile.

Provide a validation report containing:

* Total input rows.
* Valid rows.
* Invalid rows.
* Duplicate rows.
* Missing coordinates.
* Missing dates.
* Invalid severity values.
* Records excluded from specific analyses.

Preserve the distinction between rejecting a record and excluding it from a particular calculation.

5.5 Geographic Hotspot Detection

Implement a configurable geographic grid-based hotspot algorithm.

Default settings:

* Geographic grid cell: 0.02 degrees, matching the existing MapReduce configuration.
* Historical analysis window: 90 days when the dataset contains sufficient date coverage.
* Severity weights: fatal = 10, serious = 5, slight = 1, when using compatible STATS19 severity codes.
* Recency half-life: 30 days.

These are initial configuration defaults, not universally optimal parameters.

Allow users to adjust the grid size, analysis window, and scoring settings.

Scoring

For each valid record:

record_weight = severity_weight × 0.5^(age_days / half_life_days)

Where:

* severity_weight is derived from the documented severity mapping.
* age_days is the difference between the selected analysis date and the collision date.
* half_life_days is a positive configurable value.

For each cell:

hotspot_score = sum(record_weight)

The analysis date and historical window must be applied consistently.

Reject invalid settings such as a zero or negative half-life.

Do not compare raw hotspot scores across datasets or configurations without explaining differences in exposure, time window, grid size, and weighting.

Required Hotspot Results

For each hotspot, display:

* Rank.
* Geographic cell identifier.
* Representative latitude and longitude.
* Total collision count.
* Severity breakdown.
* Weighted hotspot score.
* First and last collision dates.
* Most frequent time band, when available.
* Comparison with the overall dataset baseline, when statistically meaningful.

Do not invent road names for geographic cells.

Allow the user to open the hotspot on the map.

5.6 Map Visualization

Keep the existing Leaflet integration if it works correctly.

Requirements:

* Show collision locations or aggregated hotspot cells.
* Distinguish hotspots by a documented visual severity scale.
* Display hotspot details when selected.
* Support zoom and pan.
* Support date and time filters.
* Support selection of an individual hotspot.
* Handle empty datasets.
* Handle large datasets without rendering every record unnecessarily.
* Display geographic coordinate information.
* Provide a useful fallback when map tiles cannot be loaded.

Use clustering, aggregation, or canvas rendering where appropriate.

Map Dependencies

Prefer a maintained, free mapping library.

Do not assume that public map tile services have unlimited usage.

Display required map attribution.

Do not bundle an unverified or unlicensed copy of a third-party library.

If external map tiles are unavailable, provide a functional local analytical view instead of a broken blank map.

5.7 Time-Based Analysis

Support these time bands:

* Morning peak: 07:00–09:59.
* Daytime: 10:00–15:59 and 05:00–06:59.
* Evening peak: 16:00–18:59.
* Night: 19:00–04:59.

These defaults match the existing project convention and should be configurable.

Support:

* Hourly distributions.
* Day-of-week distributions.
* Weekday versus weekend comparisons.
* Time-band hotspot filtering.
* Severity by time band.
* Collision trends over time.

Do not assign a time band to a record with an invalid or missing time without explicitly identifying it as unknown.

5.8 Filters

Provide:

* Date range.
* Severity.
* Time band.
* Geographic bounds.
* Minimum collision count.
* Minimum hotspot score.
* Top-N result limit.
* Search by hotspot identifier.
* Optional dataset-specific fields when available.

All relevant charts, tables, and map layers must update consistently when filters change.

Provide a clear-all-filters action.

5.9 Hotspot Details

When a hotspot is selected, show:

* Location.
* Collision count.
* Severity breakdown.
* Weighted score.
* Time distribution.
* Historical trend.
* Date range.
* Data completeness.
* Factors supported by the actual dataset.

Provide contextual explanations for the calculated score.

Do not claim that a particular road design, weather condition, or driver behaviour caused collisions unless the available evidence supports the claim.

5.10 Export

Support exporting:

* Ranked hotspots as CSV.
* Filtered collision records as CSV.
* Analysis summaries as JSON.
* Data validation reports as JSON or CSV.

Exported data must correspond to the active filters.

Prevent spreadsheet formula injection in CSV exports by safely handling untrusted text values that could be interpreted as formulas.

Do not export hidden records or unrelated data unexpectedly.

5.11 Sample Dataset

Provide a small sample dataset for demonstration.

Requirements:

* Label it clearly as synthetic.
* Never present sample records as verified real accidents.
* Make it possible to replace the sample with a real dataset.
* Keep the sample small enough to run on ordinary hardware.
* Ensure that the sample can exercise the principal workflows.

⸻

6. FEATURES TO REMOVE, DISABLE, OR REWORK

Remove functionality that adds complexity without delivering verified value.

Do not delete working components before checking their dependencies.

6.1 Remove Fake Data

Remove or replace:

* Hard-coded accident counts presented as live statistics.
* Fabricated weather observations.
* Predefined weather forecasts presented as current forecasts.
* Fake road names inferred from coordinates.
* Hard-coded pipeline health claims.
* Artificial confidence values.
* Unsupported real-time event claims.
* Forecast results presented as validated machine learning predictions without evidence.
* Synthetic economic benefits presented as actual savings.
* Unsupported model performance claims.

If a component is only a demonstration, label it clearly as a demonstration.

6.2 Remove Duplicate Implementations

Inspect for:

* Duplicate ingestion scripts.
* Duplicate aggregation logic.
* Multiple conflicting severity mappings.
* Repeated data preparation code.
* Redundant API endpoints.
* Unused frontend components.
* Duplicate configuration files.
* Obsolete scripts.
* Dependencies that are no longer imported.

Retain one authoritative implementation for each business rule wherever practical.

The browser and backend may have separate implementations, but they must follow the same documented rules and pass equivalent tests.

6.3 Remove Unnecessary Runtime Dependencies

The basic website must not require:

* Kafka.
* Hadoop.
* Redis.
* A database.
* A paid API.
* An LLM provider.
* A cloud account.
* A permanent backend process.

These technologies may remain in an optional advanced mode when they serve a real purpose.

Do not remove Kafka or Hadoop from the advanced architecture solely to simplify the basic website.

6.4 Remove Unsupported Features

Disable or remove the following until implemented and verified:

* Fake live streaming.
* Fake weather-aware forecasting.
* Fake road infrastructure enrichment.
* Fake webhook notifications.
* Unsupported real-time monitoring.
* Unverified AI explanations.
* Unverified patrol optimization claims.
* Unverified economic impact estimates.

Where appropriate, replace them with a documented placeholder explaining the missing data or service.

A disabled feature must not appear to be operational.

⸻

7. INTELLIGENCE AND ADVANCED ANALYTICS

Implement advanced features only after the core application is correct.

7.1 Historical Trend Analysis

Calculate collision counts and severity distributions over configurable time periods.

Requirements:

* Daily and weekly aggregation.
* Comparison with the previous equivalent period.
* Absolute change.
* Percentage change when the baseline is nonzero.
* Clear treatment of missing dates.
* Identification of incomplete observation periods.

Do not describe an increase in counts as an increase in underlying accident risk unless traffic exposure or an appropriate denominator is available.

7.2 Emerging Hotspots

Identify cells whose recent collision activity has increased relative to an appropriate historical baseline.

Requirements:

* Configurable recent and baseline windows.
* Minimum observation requirements.
* Comparison of equivalent time periods where appropriate.
* Clear explanation of the detection method.
* Handling of small samples.
* Distinction between a new hotspot and an established hotspot.

Use statistical tests or documented thresholds.

Do not label random fluctuations as statistically significant without appropriate evidence.

7.3 Forecasting

Forecasting is optional and must not block the core application.

First inspect the existing forecasting implementation.

The current project contains a fixed-coefficient forecasting prototype with predefined weather conditions. Do not present it as a trained, validated predictive model.

If forecasting is retained:

1. Define the prediction target.
2. Establish the time resolution.
3. Create chronological training, validation, and test splits.
4. Prevent future information from leaking into training features.
5. Build a simple baseline forecast.
6. Compare any advanced model against that baseline.
7. Evaluate using appropriate metrics.
8. Report uncertainty and data limitations.
9. Document the training period and model version.
10. Display the forecast horizon and last training date.

Suitable metrics may include MAE, RMSE, and Poisson deviance, depending on the target.

Do not use random train/test splitting for a time-series evaluation when it would leak future information.

Do not display arbitrary confidence percentages.

If there is insufficient data to produce a credible forecast, show historical analysis instead.

7.4 Model Evaluation

If machine learning is implemented, provide a reproducible evaluation workflow.

Include:

* Training data description.
* Feature definitions.
* Target definition.
* Baseline comparison.
* Validation methodology.
* Test metrics.
* Error analysis.
* Limitations.
* Model versioning.

Do not claim that a model improves road safety merely because its prediction metrics are acceptable.

7.5 Explainable Insights

Generate deterministic explanations from verified statistics.

Example:

“Cell 1250:-15 contains 18 collisions in the selected period, including 3 fatal-severity records and 6 serious-severity records. Its weighted score is higher than that of 82% of observed cells.”

This explanation is acceptable only if every number is computed from the active dataset and the percentile uses a clearly defined comparison population.

Do not invent causes.

When information is unavailable, state that it is unavailable.

⸻

8. WEATHER AND ROAD INFRASTRUCTURE

These are optional enrichment features.

8.1 Weather

The application must not fabricate current weather or historical weather observations.

Weather integration may be implemented only when:

* A real data source is selected.
* Its terms of use permit the intended use.
* Its availability and limitations are documented.
* Its data can be matched to collision dates and locations.
* Missing observations are handled explicitly.

The core application must continue functioning when weather data is unavailable.

Do not make a paid weather API mandatory.

Do not use a weather forecast as though it were an observed historical condition.

8.2 Road Infrastructure

Use verified geospatial sources if road enrichment is implemented.

Possible attributes include:

* Road classification.
* Junction proximity.
* Speed limit, where available.
* Pedestrian crossing proximity, where available.
* Road geometry.

Do not infer an exact road name or infrastructure defect from latitude and longitude alone.

Distinguish between:

* Verified source attributes.
* Approximate spatial matches.
* Unavailable information.

External enrichment must not prevent the basic website from working.

⸻

9. ECONOMIC IMPACT AND PATROL PLANNING

Retain these features only if their calculations and assumptions can be verified.

9.1 Economic Analysis

If the project includes casualty cost estimates:

* Document the source and year of valuation figures.
* Document currency and geographic scope.
* Map severity categories correctly.
* Avoid double-counting collision and casualty costs.
* Distinguish estimated societal costs from government expenditure.
* Make assumptions configurable.
* Clearly label results as estimates.

Do not present hypothetical avoided collisions or estimated savings as achieved benefits.

9.2 Patrol Planning

If patrol planning is retained:

* Use actual hotspot coordinates.
* Explain how hotspot priority is calculated.
* Respect user-defined staffing and time constraints.
* Avoid claiming that a heuristic produces a mathematically optimal route.
* Show assumptions and limitations.
* Avoid exposing sensitive personal information.

If a reliable route service is unavailable, provide hotspot prioritisation without claiming to calculate real driving routes.

⸻

10. OPTIONAL BIG-DATA ARCHITECTURE

Preserve the useful existing big-data components.

The advanced processing architecture may include:

1. Historical collision CSV ingestion.
2. Python data validation.
3. Kafka event production.
4. Kafka topic partitioning.
5. Kafka consumer processing.
6. HDFS date-partitioned storage.
7. Hadoop MapReduce processing.
8. Hotspot aggregation and ranking.
9. API access to processed results.
10. Dashboard visualisation.

The big-data pipeline must be optional.

10.1 Kafka

Verify:

* Producer configuration.
* Consumer configuration.
* Topic creation.
* Partition settings.
* Message serialization.
* Retry behaviour.
* Consumer offsets.
* Duplicate handling.
* Dead-letter handling.
* Error reporting.

Do not report a successful ingestion merely because a message was submitted to a producer.

Verify that messages are consumed and processed.

10.2 HDFS

Verify:

* Directory creation.
* Date partitioning.
* File naming.
* Atomic publication.
* Duplicate batch handling.
* Write failures.
* Permissions.
* Recovery behaviour.

Do not report a successful HDFS write before confirming that the operation completed.

10.3 Hadoop MapReduce

Verify the existing jobs:

* Deduplication and scoring.
* Geographic and time-band aggregation.
* Top-N ranking.

Requirements:

* Consistent input schemas.
* Deterministic results.
* Invalid-record counters.
* Configurable time windows.
* Configurable cell size.
* Configurable ranking limits.
* Correct severity mapping.
* Correct date-window boundaries.
* Correct duplicate handling.
* Reproducible output.

Inspect the difference between the grid configuration and any H3 implementation.

Use one documented geographic aggregation strategy per processing workflow, or explicitly explain the differences.

10.4 Pipeline Health

Only show actual health status.

For each service, distinguish:

* Healthy.
* Unhealthy.
* Starting.
* Unavailable.
* Unknown.
* Not configured.

A successful TCP connection alone does not prove that the entire pipeline works.

Provide timestamps for health checks.

Never hard-code a healthy status.

10.5 Development and Deployment Modes

Support two modes.

Basic Mode

* Static frontend.
* Browser-side CSV processing.
* No required backend.
* No paid services.
* No API keys.
* No mandatory Docker.
* Suitable for local use and static hosting.

Advanced Mode

* Existing API.
* Kafka.
* HDFS.
* Hadoop MapReduce.
* Optional streaming ingestion.
* Optional advanced analytics.

Document the additional setup requirements.

Do not start every advanced service when the user only needs basic mode.

⸻

11. SECURITY REQUIREMENTS

Security is mandatory.

Audit the actual source code and fix confirmed vulnerabilities.

11.1 CORS

Inspect the FastAPI CORS middleware.

Requirements:

* Remove unrestricted origins where inappropriate.
* Do not combine wildcard origins with credentialed requests.
* Allow only the origins required by the deployment.
* Disable credentials unless required.
* Document development and production settings separately.

Do not use permissive CORS as a substitute for authentication.

11.2 Unsafe Evaluation

Search the repository for:

* eval().
* exec().
* Dynamic code execution.
* Unsafe deserialization.
* Shell execution.
* Dynamic SQL.
* Untrusted template rendering.

Replace unsafe parsing with structured parsers.

For example, use JSON parsing for JSON data.

If Python literal parsing is genuinely necessary, use ast.literal_eval() rather than eval().

Validate the expected type and structure after parsing.

11.3 SSRF and Webhooks

Audit all endpoints that accept URLs or make server-side HTTP requests.

Requirements:

* Require authentication for sensitive administrative operations.
* Validate schemes.
* Restrict destinations to approved hosts when possible.
* Reject loopback, private, link-local, and metadata-service addresses unless explicitly required by the trusted architecture.
* Resolve and validate destination addresses.
* Revalidate redirects.
* Prevent redirect-based bypasses.
* Set connection and read timeouts.
* Limit response sizes.
* Avoid forwarding credentials to untrusted destinations.
* Add rate limiting where appropriate.
* Log security-relevant failures without logging secrets.

Do not rely solely on string checks or a hostname allowlist without considering DNS resolution and redirects.

If webhook delivery is not required, remove the feature from the active product.

11.4 File Upload Security

Requirements:

* Enforce file-size limits.
* Validate CSV structure.
* Treat all uploaded content as untrusted.
* Avoid arbitrary file path writes.
* Prevent path traversal.
* Avoid executing uploaded files.
* Prevent browser UI injection from cell values.
* Handle malformed input safely.
* Avoid loading unbounded files into memory.

For the browser-only mode, do not transmit uploaded files externally.

11.5 Cross-Site Scripting

Requirements:

* Escape untrusted text before rendering it as HTML.
* Prefer safe DOM APIs and framework text interpolation.
* Avoid innerHTML with untrusted values.
* Sanitize HTML only when rendering HTML is genuinely required.
* Validate imported data.
* Review map popups and tooltips.
* Review exported reports and generated documents.

11.6 Secrets

Search for:

* API keys.
* Passwords.
* Tokens.
* Private credentials.
* Embedded webhook secrets.
* Unnecessary authentication bypasses.

Move necessary secrets into environment variables or a suitable secret-management mechanism.

Provide .env.example containing placeholders only.

Do not commit real secrets.

If a real secret has already been exposed, document the need to rotate it.

11.7 Command Injection

Review subprocess usage.

Requirements:

* Avoid shell command construction with untrusted values.
* Prefer argument arrays over shell strings.
* Validate all command-line parameters.
* Restrict commands to expected operations.
* Do not expose arbitrary command execution through an API.

11.8 API Security

Where an API exists:

* Validate request schemas.
* Limit request body size.
* Handle invalid input consistently.
* Avoid exposing filesystem paths.
* Avoid returning stack traces in production.
* Apply authentication to sensitive operations.
* Add rate limiting to exposed expensive operations where appropriate.
* Avoid insecure direct object references.
* Apply appropriate timeouts.
* Protect administrative operations.
* Avoid exposing infrastructure management interfaces publicly.

Do not introduce a complex authentication system if the core application does not need user accounts.

11.9 Dependency Security

Inspect package manifests and lockfiles.

Run suitable security scanners when available.

Examples include:

* npm audit.
* pip-audit.
* Dependency-specific vulnerability scanners.
* Secret scanners.
* Static analysis tools.

Use the tools supported by the existing project.

Do not claim that a dependency is safe merely because installation succeeds.

Do not blindly upgrade every package.

Check compatibility, remove unused dependencies, and fix vulnerabilities without unnecessarily breaking the application.

If the environment cannot access vulnerability databases, document the limitation.

11.10 Security Headers

For production deployment, configure appropriate security headers, including:

* Content Security Policy.
* X-Content-Type-Options.
* Referrer-Policy.
* Frame protection through CSP.
* Strict-Transport-Security when served over HTTPS and appropriate for the domain.

Avoid policies that break legitimate application functionality.

11.11 Privacy

* Do not collect unnecessary personal information.
* Do not add tracking by default.
* Do not send datasets to AI services.
* Do not transmit datasets to analytics providers without explicit justification.
* Avoid logging uploaded records.
* Document external network requests.

11.12 Security Verification

After fixing vulnerabilities:

1. Re-run the relevant tests.
2. Test malicious and malformed inputs.
3. Verify CORS behaviour.
4. Verify URL validation and redirect handling.
5. Verify upload size limits.
6. Verify safe rendering.
7. Run available dependency and static-analysis scans.
8. Document unresolved findings.

A source review alone must not be described as a complete penetration test.

⸻

12. USER INTERFACE AND EXPERIENCE

Create a clean, professional analytical interface.

12.1 Design Requirements

* Responsive layout.
* Clear visual hierarchy.
* Consistent spacing.
* Readable typography.
* Accessible contrast.
* Meaningful chart labels.
* Useful empty states.
* Clear error messages.
* Loading indicators.
* Consistent filter controls.
* Keyboard-accessible interactions.
* Mobile-friendly tables and charts.

Avoid excessive animations, unnecessary decorative widgets, and oversized dashboard cards.

Do not sacrifice analytical accuracy for visual effects.

12.2 Required Pages or Sections

Keep the navigation simple.

Recommended sections:

1. Overview.
2. Accident Map.
3. Hotspot Analysis.
4. Trends.
5. Data Import.
6. About and Data Sources.

Advanced pipeline monitoring may be included only when the advanced backend is configured.

Do not create a separate page for every minor feature.

12.3 UI Behaviour

Every visible control must have a defined action.

Do not leave:

* Fake buttons.
* Placeholder links.
* Filters that do not affect results.
* Export controls that do nothing.
* Charts containing hard-coded values.
* Misleading loading animations.
* Navigation items leading to empty pages.

If a feature is unavailable, explain why and disable its control appropriately.

⸻

13. PERFORMANCE REQUIREMENTS

The application should run efficiently on an ordinary student laptop.

13.1 Browser Performance

* Avoid unnecessary dependencies.
* Avoid repeated full-dataset scans when an index or aggregation can be reused.
* Debounce expensive search inputs where appropriate.
* Avoid unnecessary chart re-rendering.
* Use chunked processing for large uploads.
* Aggregate geographic data before rendering when appropriate.
* Provide progress feedback for expensive operations.
* Release unused resources.
* Avoid memory leaks.
* Avoid blocking the main thread for long computations.

13.2 Backend Performance

Where the backend is retained:

* Avoid loading an entire large dataset into memory unnecessarily.
* Use streaming or batch processing when appropriate.
* Add indexes or caches only when justified.
* Avoid repeated expensive computations.
* Configure timeouts.
* Limit concurrency and resource consumption appropriately.

13.3 Performance Verification

Measure performance using representative datasets.

Record:

* Dataset size.
* Number of records.
* Parsing time.
* Aggregation time.
* Rendering time.
* Memory usage when measurable.

Do not invent benchmark results.

If the application cannot meet a target, report the measured result and the bottleneck.

⸻

14. FREE-TIER AND COST REQUIREMENTS

The core application must remain usable without paid services.

14.1 Required Free Functionality

* Local CSV upload.
* Local data processing.
* Hotspot calculations.
* Filters.
* Charts.
* Map interaction where tile availability permits.
* CSV export.
* JSON export.
* Sample dataset.
* Basic reporting.

No API key must be required for these functions.

14.2 External Services

External services must be optional.

Do not make any of the following mandatory:

* Paid AI services.
* Paid weather services.
* Paid mapping services.
* Paid databases.
* Paid analytics services.
* Paid cloud processing.

Prefer free, open-source technologies and authoritative open datasets.

Respect usage policies, rate limits, licences, and attribution requirements.

14.3 Deployment

Prefer static hosting for the basic application.

If the existing public website uses GitHub Pages, preserve that deployment path when compatible.

Do not require a server for a feature that can be implemented reliably in the browser.

Document the difference between:

* Static website deployment.
* Local backend deployment.
* Advanced distributed deployment.

Do not claim unlimited free hosting, unlimited API access, or unlimited map tiles.

⸻

15. TESTING REQUIREMENTS

Implement automated tests.

Testing must cover actual behaviour, not merely confirm that a page renders.

15.1 Data Processing Tests

Test:

* Valid CSV.
* Empty CSV.
* Missing columns.
* Invalid coordinates.
* Invalid dates.
* Missing dates.
* Invalid severity.
* Duplicate identifiers.
* Duplicate records without identifiers.
* Malformed quoting.
* UTF-8 BOM.
* Quoted commas.
* Empty fields.
* Negative counts.
* Very large files within configured limits.

15.2 Hotspot Tests

Verify:

* Geographic cell assignment.
* Boundary coordinates.
* Severity weights.
* Recency weighting.
* Time-band classification.
* Date-window boundaries.
* Duplicate handling.
* Collision counts.
* Severity aggregation.
* Score ranking.
* Deterministic tie-breaking.
* Configurable grid size.
* Configurable half-life.

Use hand-calculated fixtures to verify expected results.

15.3 Frontend Tests

Test:

* Uploading a dataset.
* Previewing data.
* Rejecting invalid data.
* Replacing a dataset.
* Applying filters.
* Clearing filters.
* Selecting a hotspot.
* Displaying correct statistics.
* Exporting filtered data.
* Displaying empty states.
* Handling unavailable map tiles.
* Responsive layout.
* Keyboard accessibility.

15.4 Backend Tests

If the API is retained, test:

* Request validation.
* Response schemas.
* Invalid dates.
* Invalid coordinates.
* CORS restrictions.
* Error handling.
* Authentication where required.
* SSRF protections.
* File upload limits.
* Timeout behaviour.
* Health-check accuracy.

15.5 Big-Data Tests

If advanced mode is retained, test:

* Kafka message ingestion.
* Malformed message handling.
* Duplicate processing.
* HDFS write failure.
* Retry behaviour.
* Consumer offset handling.
* MapReduce job failure.
* Empty input.
* Missing date partitions.
* Output consistency.
* End-to-end processing.

15.6 End-to-End Tests

Verify the main user workflow:

1. Open the website.
2. Load a dataset.
3. Validate its structure.
4. Preview the data.
5. Run hotspot analysis.
6. Apply filters.
7. Select a hotspot.
8. Inspect details.
9. Export results.
10. Confirm the exported results match the visible analysis.

The workflow must work without paid services.

⸻

16. DATA SOURCES AND DATA GOVERNANCE

The application must clearly identify the origin and limitations of each dataset.

For the existing Great Britain accident-data workflow, inspect the official UK Department for Transport STATS19 documentation and dataset schema.

Do not assume that a dataset is current simply because it is present in the repository.

For each imported dataset, record where possible:

* Dataset name.
* Source.
* Import date.
* Observation date range.
* Number of input rows.
* Number of valid rows.
* Number of rejected rows.
* Schema.
* Coordinate system.
* Severity mapping.
* Processing configuration.

Display the actual observation range.

Do not label historical data as live data.

Do not automatically download large datasets on every application startup.

Do not silently replace a user’s current dataset with another dataset.

⸻

17. ARCHITECTURE AND CODE QUALITY

Use the existing stack where it remains appropriate.

Do not introduce a new framework solely because it is fashionable.

17.1 Frontend

Maintain a clear separation between:

* UI components.
* Data loading.
* Schema validation.
* Data processing.
* Hotspot calculations.
* Visualisation.
* Export functionality.

Avoid putting all business logic into a single component.

17.2 Backend

If retained, separate:

* API routes.
* Validation schemas.
* Business logic.
* Data access.
* External integrations.
* Configuration.
* Health checks.

Keep request handlers thin.

17.3 Shared Rules

Document the authoritative definitions for:

* Severity weights.
* Time bands.
* Geographic grid calculation.
* Recency decay.
* Date-window boundaries.
* Duplicate handling.
* Hotspot ranking.

Prevent the browser and Hadoop implementation from silently using conflicting definitions.

17.4 Configuration

Use configuration for appropriate values such as:

* Grid size.
* Historical window.
* Recency half-life.
* Severity mapping.
* Maximum upload size.
* Allowed origins.
* API timeouts.
* Dataset location.
* Advanced service endpoints.

Validate configuration on startup.

Use sensible defaults.

Do not expose secrets in frontend environment variables.

⸻

18. DOCUMENTATION

Update the following files.

README.md

Must contain:

* Project overview.
* Main features.
* Architecture.
* Technology stack.
* Repository structure.
* Requirements.
* Basic setup.
* Running the website.
* Loading a dataset.
* Dataset schema.
* Hotspot scoring methodology.
* Running automated tests.
* Deployment instructions.
* Advanced big-data setup.
* Troubleshooting.
* Limitations.

PRD.md

Must describe the implemented product and remaining requirements.

SECURITY_AUDIT.md

Must record:

* Findings.
* Severity.
* Affected components.
* Fixes.
* Verification.
* Remaining risks.

CHANGELOG.md

Summarise meaningful changes.

.env.example

Include only configuration placeholders.

Do not include secrets.

LICENSES_AND_ATTRIBUTION.md

Document third-party libraries, datasets, map providers, and attribution requirements where applicable.

⸻

19. IMPLEMENTATION PRIORITIES

Implement the project in the following order.

Phase 1: Repository Audit

* Inspect the complete repository.
* Run existing tests and builds.
* Identify security vulnerabilities.
* Identify fake functionality.
* Identify duplicated code.
* Identify broken dependencies.
* Document the current architecture.

Deliverable: Audit report and implementation plan.

Phase 2: Security Fixes

* Fix unsafe parsing.
* Restrict CORS.
* Fix or disable unsafe webhook functionality.
* Validate external URL requests.
* Fix input-validation problems.
* Address dependency vulnerabilities.
* Remove exposed secrets.
* Add appropriate security controls.

Deliverable: Security changes and verification tests.

Phase 3: Core Data Processing

* Implement reliable CSV parsing.
* Implement schema mapping.
* Implement validation.
* Implement geographic aggregation.
* Implement severity scoring.
* Implement recency weighting.
* Implement deterministic ranking.
* Implement exports.

Deliverable: Tested data-processing logic.

Phase 4: Website Completion

* Complete the dashboard.
* Complete the map.
* Implement filters.
* Implement hotspot details.
* Implement data import.
* Implement exports.
* Implement error and empty states.
* Verify responsive behaviour.

Deliverable: Functional core website.

Phase 5: Intelligence

* Add trend analysis.
* Add emerging hotspot detection.
* Evaluate forecasting feasibility.
* Add only validated or clearly labelled analytical features.
* Document model limitations.

Deliverable: Reliable analytical capabilities.

Phase 6: Advanced Big-Data Integration

* Verify Kafka ingestion.
* Verify HDFS storage.
* Verify MapReduce calculations.
* Verify API integration.
* Add real health checks.
* Verify end-to-end processing.

Deliverable: Optional working advanced mode.

Phase 7: Testing and Deployment

* Run all available tests.
* Run production builds.
* Run security scans.
* Run end-to-end tests.
* Fix regressions.
* Update documentation.
* Verify deployment configuration.

Deliverable: Release-ready project with a documented verification report.

⸻

20. ACCEPTANCE CRITERIA

The project must satisfy the following criteria.

Core Functionality

* The website opens successfully.
* Users can load a sample dataset.
* Users can upload their own CSV.
* Required columns are validated.
* Invalid records are reported.
* Geographic hotspot scores are calculated correctly.
* Severity counts are accurate.
* Date and time filters work.
* The map and tables use the same active dataset.
* Hotspot details are correct.
* CSV exports match the filtered results.
* JSON exports contain the correct analysis.
* Empty states are handled.
* The application works without paid APIs.

Data Integrity

* No fabricated values are presented as real observations.
* Synthetic data is labelled.
* Historical data is not labelled as live.
* Dataset freshness is displayed.
* Forecast claims are supported by appropriate evaluation.
* Unavailable external information is clearly identified.

Security

* CORS is appropriately configured.
* Unsafe evaluation has been removed.
* URL fetching is protected against SSRF.
* Uploaded files are validated.
* Untrusted text is safely rendered.
* CSV exports handle formula injection.
* Secrets are not committed.
* Sensitive API operations are protected.
* Available dependency scans have been run.
* Remaining risks are documented.

Engineering

* Production build succeeds.
* Automated tests pass.
* Important calculations have deterministic tests.
* No broken imports remain.
* No required scripts are missing.
* Removed dependencies are no longer referenced.
* README instructions work.
* The basic mode works without starting the big-data stack.

Advanced Mode

* Kafka ingestion is verified when enabled.
* HDFS writes are verified when enabled.
* MapReduce output is verified when enabled.
* API responses reflect actual system state.
* Health checks do not use hard-coded statuses.

⸻

21. REQUIRED FINAL REPORT FROM ANTIGRAVITY

After implementation, produce a final report containing:

1. Summary of changes.
2. Original architecture.
3. Final architecture.
4. Features retained.
5. Features removed.
6. Features added.
7. Security vulnerabilities found.
8. Security vulnerabilities fixed.
9. Remaining security risks.
10. Dependencies removed and added.
11. Automated tests executed.
12. Test results.
13. Production build results.
14. Performance measurements.
15. Dataset validation results.
16. Deployment instructions.
17. Known limitations.
18. Features that remain incomplete.

For every important claim, provide evidence such as a test result, file path, command output, or reproducible verification procedure.

Do not claim that all tests passed if some tests were not run.

Do not claim that a vulnerability was fixed without verifying the change.

Do not claim that the application is production-ready merely because it builds.

⸻

22. FINAL DIRECTIVE

Begin by auditing the existing repository.

Then implement the highest-priority requirements directly in the source code.

Preserve working functionality and the useful big-data architecture, but make the basic website independent of the distributed stack.

Remove unnecessary, duplicated, misleading, unsafe, or unsupported functionality only after verifying its dependencies.

Prioritise correctness, security, usability, maintainability, and low operating cost over adding more technologies.

Do not stop after writing a plan.

Do not stop after creating the UI.

Do not stop when the project merely compiles.

Continue until the core user workflows are implemented and tested.

If a requirement cannot be completed because of missing dependencies, inaccessible services, unavailable data, or environmental restrictions, document the exact limitation and implement the best safe fallback.

The final deliverable must be a functional, tested, secure-by-design, low-cost road accident hotspot analytics application with an optional advanced big-data pipeline.