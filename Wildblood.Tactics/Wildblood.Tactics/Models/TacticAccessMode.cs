namespace Wildblood.Tactics.Models;

/// <summary>
/// Defines the access mode for a tactic.
/// </summary>
public enum TacticAccessMode
{
    /// <summary>
    /// Private tactic - only accessible by the creator (requires account)
    /// </summary>
    Private = 0,

    /// <summary>
    /// Public tactic - accessible by everyone, saved to database (no account required)
    /// </summary>
    Public = 1,

    /// <summary>
    /// Local tactic - not saved to database, only exists in browser session (no account required)
    /// Import/Export available for persistence
    /// </summary>
    Local = 2
}
