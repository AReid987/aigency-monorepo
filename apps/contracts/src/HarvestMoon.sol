// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HarvestMoon — Crystal Graft quality gate for Aigency
/// @notice Controls when a Crystal Graft can be minted based on vault quality metrics.
///         Metrics are submitted by ORACLE's off-chain oracle process.
///         Graft minting requires 2-of-3 multisig (THE ARCHITECT + ORACLE + LIBRARIAN wallets).
/// @dev Deploy on Base L2 (chain ID 8453). Testnet: Base Sepolia (84532).
contract HarvestMoon {

    // ─── State ────────────────────────────────────────────────────────────────

    address public immutable architect;
    mapping(address => bool) public trustedSubmitters;

    uint256 public lintHealthScore;   // 0–100 (scaled ×1e2 in submitMetrics)
    uint256 public wikiDensity;       // 0.00–1.00 (scaled ×1e4 in submitMetrics)
    uint256 public vaultAgeDays;
    uint256 public lastUpdated;
    uint256 public lastHarvestAt;
    uint256 public graftCount;

    // Harvest thresholds (matching lint.ts defaults)
    uint256 public constant LINT_THRESHOLD      = 85;   // ≥ 85/100
    uint256 public constant DENSITY_THRESHOLD   = 7000; // ≥ 0.70 (×1e4)
    uint256 public constant AGE_THRESHOLD_DAYS  = 90;
    uint256 public constant HARVEST_COOLDOWN    = 30 days;
    uint256 public constant SUBMIT_TIMELOCK     = 24 hours;

    // ─── Events ───────────────────────────────────────────────────────────────

    event MetricsSubmitted(uint256 lintScore, uint256 density, uint256 ageDays, uint256 timestamp);
    event GraftHarvested(uint256 indexed graftId, address indexed recipient, uint256 timestamp);
    event HarvestConditionsMet(uint256 timestamp);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _architect) {
        architect = _architect;
        trustedSubmitters[_architect] = true;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setTrustedSubmitter(address submitter, bool trusted) external {
        require(msg.sender == architect, "HarvestMoon: not architect");
        trustedSubmitters[submitter] = trusted;
    }

    // ─── Oracle Feed ──────────────────────────────────────────────────────────

    /// @notice Submit vault quality metrics. Only callable by trusted oracle address.
    /// @param _lintScore    0–100 lint health score
    /// @param _wikiDensity  0.0–1.0 wiki density, scaled ×1e4 (e.g. 0.74 → 7400)
    /// @param _ageDays      Days since vault genesis
    function submitMetrics(
        uint256 _lintScore,
        uint256 _wikiDensity,
        uint256 _ageDays
    ) external {
        require(trustedSubmitters[msg.sender], "HarvestMoon: not trusted submitter");
        require(_lintScore <= 100, "HarvestMoon: invalid lint score");
        require(_wikiDensity <= 10000, "HarvestMoon: invalid wiki density");

        lintHealthScore = _lintScore;
        wikiDensity     = _wikiDensity;
        vaultAgeDays    = _ageDays;
        lastUpdated     = block.timestamp;

        emit MetricsSubmitted(_lintScore, _wikiDensity, _ageDays, block.timestamp);

        if (isHarvestReady()) {
            emit HarvestConditionsMet(block.timestamp);
        }
    }

    // ─── Harvest Gate ─────────────────────────────────────────────────────────

    /// @notice Returns true when all harvest conditions are met and cooldown has elapsed.
    function isHarvestReady() public view returns (bool) {
        if (lastUpdated == 0) return false;
        if (block.timestamp < lastUpdated + SUBMIT_TIMELOCK) return false;
        if (block.timestamp < lastHarvestAt + HARVEST_COOLDOWN) return false;

        return
            lintHealthScore >= LINT_THRESHOLD &&
            wikiDensity     >= DENSITY_THRESHOLD &&
            vaultAgeDays    >= AGE_THRESHOLD_DAYS;
    }

    /// @notice Mint a Crystal Graft. Caller must be the architect or trusted submitter.
    ///         In production, replace with 2-of-3 multisig check.
    function harvestGraft(address recipient) external returns (uint256 graftId) {
        require(trustedSubmitters[msg.sender], "HarvestMoon: not authorized");
        require(isHarvestReady(), "HarvestMoon: conditions not met");

        graftId = ++graftCount;
        lastHarvestAt = block.timestamp;

        emit GraftHarvested(graftId, recipient, block.timestamp);
        // AigencyGraft.mint(recipient, graftId) — wired up after NFT contract deploy
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getMetrics() external view returns (
        uint256 _lintScore,
        uint256 _wikiDensity,
        uint256 _ageDays,
        uint256 _lastUpdated
    ) {
        return (lintHealthScore, wikiDensity, vaultAgeDays, lastUpdated);
    }
}
