// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Simple on-chain generative SVG for "Kusama Living Profile"
/// - Deploy this to Moonbase Alpha for testing or Kusama Hub for production.
/// - It returns a base64 JSON metadata string suitable for tokenURI.
/// - Keep it cheap: simple shapes + text that vary by score.
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract KusamaSVGArt {
    using Strings for uint256;

    /// @notice Generate an SVG string based on the numeric score.
    /// @param score The user's TrustFi reputation score used to influence the visual.
    function generateSVG(uint256 score) public pure returns (string memory) {
        // Map score ranges to color palettes and ring count
        (string memory primary, string memory accent, uint256 rings) = paletteAndRings(score);

        // scale = min(200, 100 + (score % 200)) -> keeps sizes reasonable
        uint256 scale = 100 + (score % 200);

        // center coordinates
        string memory cx = "250";
        string memory cy = "250";

        // Build rings (concentric circles)
        string memory ringsSvg = "";
        for (uint256 i = 0; i < rings; i++) {
            // radius increases with i and with score
            uint256 r = 40 + (i * 22) + (score % 10);
            uint256 opacity = 70 - (i * 10);
            if (opacity > 100) opacity = 100;
            ringsSvg = string.concat(
                ringsSvg,
                "<circle cx='",
                cx,
                "' cy='",
                cy,
                "' r='",
                (r).toString(),
                "' fill='none' stroke='",
                primary,
                "' stroke-opacity='",
                (opacity).toString(),
                "%' stroke-width='6' />"
            );
        }

        // A central orb whose radius scales with score
        uint256 orbRadius = 32 + (score % 40);
        string memory orb = string.concat(
            "<circle cx='",
            cx,
            "' cy='",
            cy,
            "' r='",
            orbRadius.toString(),
            "' fill='",
            accent,
            "' opacity='0.95' />"
        );

        // Decorative rotating triangles (SVG transform not animated on-chain; simple static shapes)
        string memory triangles = string.concat(
            "<g transform='translate(250,250)'>",
            "<polygon points='0,-",
            (scale / 2).toString(),
            " 10,-",
            (scale / 2 - 6).toString(),
            " -10,-",
            (scale / 2 - 6).toString(),
            "' fill='",
            primary,
            "' opacity='0.45'/>",
            "</g>"
        );

        // Score text
        string memory scoreText = string.concat(
            "<text x='250' y='270' font-family='Arial, Helvetica, sans-serif' font-size='36' text-anchor='middle' fill='#ffffff' font-weight='700'>",
            "Score: ",
            score.toString(),
            "</text>"
        );

        // Compose full SVG
        string memory svg = string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'>",
            "<defs>",
            "<linearGradient id='g1' x1='0' x2='1' y1='0' y2='1'>",
            "<stop offset='0%' stop-color='",
            primary,
            "' />",
            "<stop offset='100%' stop-color='",
            accent,
            "' />",
            "</linearGradient>",
            "</defs>",
            // background
            "<rect width='100%' height='100%' fill='url(#g1)' />",
            ringsSvg,
            orb,
            triangles,
            scoreText,
            // small footer text
            "<text x='250' y='490' font-family='Arial' font-size='12' text-anchor='middle' fill='rgba(255,255,255,0.6)'>",
            "Kusama Living Profile",
            "</text>",
            "</svg>"
        );

        return svg;
    }

    /// @notice Returns full token metadata as a data:application/json;base64,... string
    /// @param tokenId token id (for display in name)
    /// @param score user's score (controls art)
    /// @param title optional title (e.g., "Kusama Living Profile")
    function tokenMetadata(
        uint256 tokenId,
        uint256 score,
        string memory title
    ) public pure returns (string memory) {
        // Generate SVG and encode
        string memory svg = generateSVG(score);
        string memory image = string.concat(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        );

        // Build JSON metadata
        string memory name = string.concat(title, " #", tokenId.toString());
        string memory json = string.concat(
            '{"name":"',
            name,
            '", "description":"A living Kusama profile image that evolves with a TrustFi reputation score.","image":"',
            image,
            '", "attributes":[{"trait_type":"Score","value":',
            score.toString(),
            '}]}'
        );

        // Return base64-encoded JSON as data URI
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /// @notice Small helper mapping score ranges to colors & ring counts
    function paletteAndRings(uint256 score) internal pure returns (string memory primary, string memory accent, uint256 rings) {
        if (score < 50) {
            return ("#2b2d42", "#8d99ae", 3);
        } else if (score < 150) {
            return ("#264653", "#2a9d8f", 4);
        } else if (score < 400) {
            return ("#5a189a", "#7b2cbf", 5);
        } else if (score < 800) {
            return ("#ff6b6b", "#f7b267", 6);
        } else {
            return ("#ffd166", "#06d6a0", 7);
        }
    }

    // Expose a convenience function that returns only the SVG encoded as a data URI (useful for image fields)
    function imageDataURI(uint256 score) public pure returns (string memory) {
        string memory svg = generateSVG(score);
        return string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(svg)));
    }
}
