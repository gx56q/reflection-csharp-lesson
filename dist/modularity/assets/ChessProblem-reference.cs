namespace Chess;

public class ChessProblem
{
    private readonly Board board;

    public ChessProblem(Board board)
    {
        this.board = board;
    }

    public ChessStatus CalculateChessStatus() =>
        GetStatusFor(PieceColor.White);

    public ChessStatus GetStatusFor(PieceColor color)
    {
        var isCheck = IsCheckFor(color);
        var hasMoves = HasSafeMovesFor(color);
        if (isCheck)
            return hasMoves ? ChessStatus.Check : ChessStatus.Mate;

        return hasMoves ? ChessStatus.Ok : ChessStatus.Stalemate;
    }

    private bool IsCheckFor(PieceColor color) =>
        GetAllMovesOf(color.Invert())
            .Any(m => board.GetPiece(m.To).Is(color, PieceType.King));


    private bool HasSafeMovesFor(PieceColor color) =>
        GetAllMovesOf(color).Any(IsSafeMove);

    private IEnumerable<ChessMove> GetAllMovesOf(PieceColor color) =>
        board.GetPieces(color).SelectMany(GetMoves);

    private IEnumerable<ChessMove> GetMoves(Location pieceLoc) =>
        board.GetPiece(pieceLoc)!
            .GetMoves(pieceLoc, board)
            .Select(destination => new ChessMove(pieceLoc, destination));

    private bool IsSafeMove(ChessMove move)
    {
        var pieceColor = board.GetPiece(move.From)!.Color;
        using (board.PerformTemporaryMove(move.From, move.To))
            return !IsCheckFor(pieceColor);
    }
}

public record ChessMove(Location From, Location To);

public static class ChessExtensions
{
    public static PieceColor Invert(this PieceColor color) =>
        color switch
        {
            PieceColor.Black => PieceColor.White,
            PieceColor.White => PieceColor.Black,
            _ => throw new ArgumentException(color.ToString())
        };
}
