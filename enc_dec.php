<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Edsoma enc </title>
    <style type="text/css">
        ::selection {
            background-color: #E13300;
            color: white;
        }

        ::-moz-selection {
            background-color: #E13300;
            color: white;
        }

        body {
            background-color: #fff;
            margin: 40px;
            font: 13px/20px normal Helvetica, Arial, sans-serif;
            color: #4F5155;
        }

        a {
            color: #003399;
            background-color: transparent;
            font-weight: normal;
        }

        h1 {
            color: #444;
            background-color: transparent;
            border-bottom: 1px solid #D0D0D0;
            font-size: 19px;
            font-weight: normal;
            margin: 0 0 14px 0;
            padding: 14px 15px 10px 15px;
        }

        code {
            font-family: Consolas, Monaco, Courier New, Courier, monospace;
            font-size: 12px;
            background-color: #f9f9f9;
            border: 1px solid #D0D0D0;
            color: #002166;
            display: block;
            margin: 14px 0 14px 0;
            padding: 12px 10px 12px 10px;
        }

        #body {
            margin: 0 15px 0 15px;
        }

        p.footer {
            text-align: right;
            font-size: 11px;
            border-top: 1px solid #D0D0D0;
            line-height: 32px;
            padding: 0 10px 0 10px;
            margin: 20px 0 0 0;
        }

        #container {
            margin: 10px;
            border: 1px solid #D0D0D0;
            box-shadow: 0 0 8px #D0D0D0;
        }
    </style>
</head>

<body>
    <div id="container">
        <h1>Encryption & Decryption Edsoma</h1>
        <div id="body">
            <form class='form-horizontal' role='form' id='poster_add' name='poster_add' enctype='multipart/form-data'
                action="enc_dec.php" method="POST"><label><b>Text or Encryption
                    </b></label><br><textarea name="data" id="data" required="" cols="90"
                    rows="10"></textarea><br><br><label><b>Type</b></label><input type="radio" name="type"
                    value="encrypt" checked="" required="">Encrypt <input type="radio" name="type" value="decrypt"
                    required="">Decrypt <br><br><input type="submit" name="submit" value="submit"><br><br></form>
        </div>
    </div>
</body>

</html><?php $encryptionMethod='AES-256-CBC';
$secret=hash('sha256', 'xza548sa3vcr641b5ng5nhy9mlo64r6k');
$iv='5ng5nhy9mlo64r6k';

if (isset($_REQUEST['submit']) && isset($_REQUEST['data']) && $_REQUEST['data'] !='') {
    if ($_REQUEST['type']=='encrypt') {
        $plaintext=trim($_REQUEST['data']);
        $decrypt_value=$_REQUEST['data'];
        $encrypt_value=openssl_encrypt($plaintext, $encryptionMethod, $secret, 0, $iv);
        echo "<div id='container'><div id='body'><p><b>".$encrypt_value.'</p>
<p> '.$decrypt_value.'</b></p></div></div>';

            die();
    }

    else {
        $enc=$_REQUEST['data'];
        $decrypt_value=openssl_decrypt($enc, $encryptionMethod, $secret, 0, $iv);
        $encrypt_value=$_REQUEST['data'];

        echo "<div id='container'><div id='body'><p><b>".$encrypt_value.'</p>
<p>'.$decrypt_value.'</b></p>';
echo "<pre>";
        print_r(json_decode($decrypt_value, true));
        echo '</b></div></div>';
        die();
    }
}

?>